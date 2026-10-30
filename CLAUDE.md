# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Jan PhotoWeb is a Next.js 15 (App Router) photography portfolio and admin site.
TypeScript, React 19, Tailwind CSS + DaisyUI, `next-intl` (locales: `en`, `cs`),
NextAuth (credentials-based single-admin login), PostgreSQL via Drizzle ORM,
and Cloudflare Images for photo storage/delivery.

## Commands

Package manager is `pnpm`.

```bash
pnpm dev            # dev server (turbopack)
pnpm lint           # eslint
pnpm test           # vitest, single run (pnpm exec vitest for watch mode)
pnpm build          # runs db:migrate, then next build — has a DB side effect
pnpm start          # run production build

pnpm db:generate    # generate a drizzle migration from schema.ts changes
pnpm db:migrate     # apply migrations
pnpm db:push        # push schema directly (skips migration files)
pnpm db:seed        # run app/db/seed.ts
pnpm db:studio      # drizzle studio
```

Tests use Vitest ([vitest.config.ts](vitest.config.ts)) and live next to the
module they cover as `*.test.ts`; the `@/` alias resolves as in the app. Keep
tests to pure modules tested through their interfaces — they must not need
`DATABASE_URL` or Cloudflare/R2 credentials.

`pnpm build` runs database migrations as a side effect — only run it when
that's intended and `DATABASE_URL` is configured. Do not run destructive database commands unless explicitly asked.

The user often has their own `pnpm dev` running in a separate terminal. Before
starting a dev server to verify a change, check for an existing one (e.g.
`ps aux | grep "next dev"`) and prefer reusing it (hit its port directly)
instead of spawning a second one. If you do start your own, track its exact
PID and stop only that PID afterward — never stop a dev server by pattern
(e.g. `pkill -f "next dev"`), since that kills the user's server too.

## Architecture

### Routing & i18n

Every page lives under `app/[locale]/` and locale prefixes are always present
(`localePrefix: "always"` in [app/i18n/routing.ts](app/i18n/routing.ts)).
Navigation helpers (`Link`, `redirect`, `usePathname`, `useRouter`,
`getPathname`) come from `next-intl`'s `createNavigation` in that same file —
use these instead of Next's raw navigation APIs so locale prefixes are
preserved. Translation messages live in `messages/`.

[middleware.ts](middleware.ts) layers auth on top of `next-intl`'s middleware:
it hardcodes `publicPages = ["/", "/admin/login"]`, builds a locale-aware
regex from `routing.locales` to match them, and otherwise delegates to the
NextAuth `authorized` callback in [auth.ts](auth.ts) (which gates any path
containing `/admin`). The matcher excludes `/api`, so this gate covers pages
only — see "Admin API routes" below. If you add a new public route, update
`publicPages` here.

Albums use a catch-all route: `app/[locale]/albums/[[...slug]]/page.tsx`
resolves nested album hierarchy from the `slug` segments.

### Auth

Single hardcoded admin user via NextAuth Credentials provider
([auth.ts](auth.ts)), checked against `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars.
JWT session strategy; role (`"admin"`) is threaded through the `jwt` and
`session` callbacks. There is no user table or multi-user support — don't
assume one when working on auth-adjacent code.

### Data model ([app/db/schema.ts](app/db/schema.ts))

Drizzle ORM/Postgres. The portfolio tables are below; the proof-gallery
tables are described under "Final photo delivery" and "Owner registration".

- **`albums`** — self-referential via `parentId` (`onDelete: cascade`),
  forming a tree. `path` is unique and represents the full slug path;
  `(parentId, slug)` is also unique. `sortOrder` controls manual ordering
  within a parent.
- **`photos`** — belongs to one album (`onDelete: cascade`), has
  `cloudflareId` (the Cloudflare Images asset id), `visibility`
  (`"public"` | `"highlights_only"`), and `sortOrder`.
- **`portfolioHighlights`** — a join of hand-picked photos (unique on
  `photoId`) for the homepage highlights carousel, independently ordered via
  `sortOrder`.

Album/photo ordering and Cloudflare image ids are load-bearing — preserve
them when touching album or photo features. Schema changes must go through
`pnpm db:generate` (never hand-edit files in `drizzle/`), and should be
deliberate, reviewed changes rather than incidental.

### Images

All photo storage/delivery goes through Cloudflare Images. URLs are built by
[app/lib/cloudflare-images.ts](app/lib/cloudflare-images.ts)
(`getCloudflareImageUrl(cloudflareId, variant)`, variants: `card` | `detail` |
`full`) — never construct Cloudflare image URLs inline elsewhere. Uploads go
through `app/api/admin/photos/upload-url` (direct-creator-upload flow) and
`app/utils/optimize-image-for-upload.ts` handles client-side image
preprocessing before upload.

### Final photo delivery

After a proof order is paid, the photographer uploads full-quality edited
finals (can exceed Cloudflare Images' 10MB hosted-upload cap) for the client
to download, on the same `proofGalleries` row/token — no separate link.
Each final is dual-uploaded: the untouched original goes to **Cloudflare
R2** (S3-compatible; [app/lib/r2-client.ts](app/lib/r2-client.ts) wraps
presigned PUT/GET/delete), while a resized preview goes through the
existing Cloudflare Images pipeline so the client-facing viewer never
touches the R2 original. `finalPhotos` rows are created incrementally via
`app/api/admin/final-photos/*`; they're invisible to the client until the
photographer explicitly publishes
([app/api/admin/proof-galleries/[id]/publish-finals](app/api/admin/proof-galleries/[id]/publish-finals/route.ts),
sets `proofGalleries.finalsPublishedAt`), mirroring the `confirmedAt`/mark-paid
pattern. Client downloads (`app/api/proof/[token]/final-photos/*`) use
short-lived R2 presigned URLs per photo, plus a "download all" zip streamed
by a standalone Cloudflare Worker ([workers/delivery-zip](workers/delivery-zip))
that has its own R2 bucket binding — kept out of the Next.js app to avoid
Vercel's function duration/memory limits for bulk zips of large files; it's
deployed independently via `wrangler deploy`, not part of `pnpm build`.
The app and the Worker share one signing module for the "download all"
request, [app/lib/zip-signature.ts](app/lib/zip-signature.ts), which the
Worker imports by relative path and wrangler bundles — so it must stay
Web-Crypto-only (no Node or Next.js imports, no `@/` alias), and changing
its signing format needs both the app and the Worker redeployed.
**Retention**: a proof gallery is never auto-deleted while paid but
undelivered — the photographer may need an unbounded amount of time to
edit and upload finals, so there's no deletion countdown at all until
finals are actually published. Once published,
[app/lib/final-delivery-retention.ts](app/lib/final-delivery-retention.ts)
(`FINAL_DELIVERY_RETENTION_DAYS` = 365 days from `finalsPublishedAt`, also shown to the client as a deletion date on the finals page) and a
daily Vercel cron ([vercel.json](vercel.json) →
[app/api/cron/delete-expired-final-deliveries](app/api/cron/delete-expired-final-deliveries/route.ts),
auth'd via `CRON_SECRET`) take over the gallery's entire lifecycle — it
deletes the hero images, the proof photos' Cloudflare images, the final
photos' R2/Cloudflare assets, and then the `proofGalleries` row itself
(cascading `proofPhotos`/`proofOrders`/`finalPhotos`/`galleryClients`/
`emailVerifications`), deleting in the same transaction any linked
`clients` row left with no galleries and no news & offers consent;
consenting clients are kept as contacts. The same cron, after
deleting, emails a claimed gallery's owner 30 and 7 days before its
deletion date — never guests or unclaimed galleries. Which reminder is due
is the pure, tested
[app/lib/deletion-reminders.ts](app/lib/deletion-reminders.ts); each send
is recorded on the gallery (`deletionReminder30SentAt`/`deletionReminder7SentAt`)
so it goes out once and is caught up if the cron missed a day. This is the *only*
automatic deletion path in the app — manual deletion via the admin UI's
"Delete gallery" button is always available regardless of state. Both
paths (and single-final delete) go through one teardown module,
[app/lib/gallery-teardown.ts](app/lib/gallery-teardown.ts), behind an
`AssetStore` interface (real adapter:
[app/lib/asset-store.ts](app/lib/asset-store.ts)) and a `GalleryRecords`
one (real adapter, with DB loading and the row-locked transaction that
decides which clients go:
[app/lib/delete-gallery-by-id.ts](app/lib/delete-gallery-by-id.ts)) —
assets are deleted before the row, so a failure leaves the gallery in
place to retry. There used to be a separate 15-day post-payment cron for
proof-only galleries; it was retired because it could delete a paid
gallery's proof photos before the photographer had a chance to deliver
finals through this same system.

### Owner registration

A gallery with `proofGalleries.requiresRegistration` shows a registration
screen instead of its published finals until someone claims it; the first
person to verify their email becomes its single owner, and from then on
anyone with the link sees and downloads everything. The column defaults to
false so pre-existing links keep working; the create route turns it on for
new galleries. The rule is `getClientView`'s second argument in
[app/lib/gallery-lifecycle.ts](app/lib/gallery-lifecycle.ts), and
`loadClientGallery` derives `canDownload` from the view, so the finals page
and the download routes gate together — guard any new client finals route
with `canDownload`. Proof selection is never gated.

- **Clients:** `clients` (one row per normalised email) links to galleries
  through `galleryClients` with role `owner` | `guest`. A partial unique
  index allows one owner per gallery, and the claim in
  [app/lib/client-registration.ts](app/lib/client-registration.ts) runs
  under row locks. There is no client login or session cookie; NextAuth
  stays admin-only.
- **Guests:** the finals view shows an optional, dismissible "Get news &
  offers" box (consent required) that uses the same routes and
  verification. Each verification stores the form it started from
  (`emailVerifications.purpose`), and `getRegistrationRole` in the
  lifecycle module turns that into a role: a guest signup is always a
  guest, never the owner; the owner form claims only while the gallery is
  gated and unclaimed, and registers nothing after that. The page hands an
  emailed link only to its own form's screen. A guest signup never renames
  an existing client.
- **Verification:** emailed magic link or 6-digit code, either one works.
  The rules (15-minute expiry, single use, attempts, resend cooldown) are
  the pure, tested
  [app/lib/email-verification.ts](app/lib/email-verification.ts). Stored
  hashes are HMACs keyed by `EMAIL_VERIFICATION_SECRET`, because a plain
  hash of a 6-digit code is reversible. Rate limits are per gallery and
  email only: a gallery-wide limit would let anyone holding the link lock
  the real owner out.
- **Consent:** news & offers consent is stored only when ticked, with a
  timestamp and the version of that box's wording,
  `MARKETING_CONSENT_VERSIONS.owner` or `.guest`
  ([app/lib/marketing-consent.ts](app/lib/marketing-consent.ts)). Bump a
  box's version whenever its wording in `messages/*.json` changes.
- **Email preferences:** every email the app sends a client carries a
  signed "Manage email preferences" link to the public, no-login
  `/[locale]/email-preferences` page, where the client turns news & offers
  on (recording `MARKETING_CONSENT_VERSIONS.preferences`) or off (clearing
  consent). The token is the normalised email plus its HMAC, keyed by
  `EMAIL_PREFERENCES_SECRET`: no stored state, so it works before a
  `clients` row exists, and it never expires. Signing is the pure, tested
  [app/lib/email-preferences-link.ts](app/lib/email-preferences-link.ts);
  build the URL with `getEmailPreferencesUrl` in
  [app/lib/email-preferences.ts](app/lib/email-preferences.ts), and add
  it to any new client email.

### Admin API routes (`app/api/admin/`)

REST-ish route handlers for album/photo CRUD, reordering, and moving photos
between albums (`albums/[id]`, `albums/reorder`, `photos/move`,
`photos/reorder`, `photos/upload-url`). The middleware's matcher excludes
`/api`, so it does **not** protect these routes — each handler must protect
itself by being wrapped in `withAdmin` from
[app/lib/with-admin.ts](app/lib/with-admin.ts)
(`export const POST = withAdmin(async (req: Request) => { ... })`), which
returns 401 unless the session has the admin role. Don't write ad-hoc session
checks. Unlike pages, these routes aren't locale-prefixed.

### Env vars

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL` / `POSTGRES_URL`,
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_API_TOKEN`, `GMAIL_USER`,
`GMAIL_PASS` (contact form, admin notifications, client verification
and deletion reminder emails via nodemailer), `EMAIL_VERIFICATION_SECRET` (keys the stored
verification hashes; registration requests fail without it),
`EMAIL_PREFERENCES_SECRET` (signs the "Manage email preferences" links;
rotating it breaks every link already emailed, and registration requests
fail without it), `CRON_SECRET`
(bearer token checked by
`app/api/cron/delete-expired-final-deliveries`), `NEXT_PUBLIC_SITE_URL`
(the deployed site's base URL, e.g. `https://example.com` — used by
robots/sitemap, for the gallery links in deletion reminders, and for the
admin link in selection-submitted emails, which points at the default
locale since there's no stored admin locale; the emails fall back to the
request's origin when unset). Final photo delivery
(`app/lib/r2-client.ts`) additionally needs `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
(Cloudflare R2, S3-compatible — stores full-quality final photos),
`FINAL_DELIVERY_ZIP_SECRET` (HMAC secret shared with the
`workers/delivery-zip` Cloudflare Worker) and `FINAL_DELIVERY_WORKER_URL`
(that Worker's deployed URL, used for bulk zip downloads). Keep these
in `.env.local`; never commit them.

## Conventions

- Prefer server components; add `"use client"` only when browser APIs,
  state, or event handlers require it.
- TypeScript strict mode; `@typescript-eslint/no-explicit-any` is an eslint
  error — don't introduce `any`.
- Keep changes focused; follow existing formatting/component patterns rather
  than introducing new ones.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root (created lazily by `/domain-modeling`). See `docs/agents/domain.md`.
