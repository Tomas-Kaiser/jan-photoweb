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
pnpm build          # runs db:migrate, then next build — has a DB side effect
pnpm start          # run production build

pnpm db:generate    # generate a drizzle migration from schema.ts changes
pnpm db:migrate     # apply migrations
pnpm db:push        # push schema directly (skips migration files)
pnpm db:seed        # run app/db/seed.ts
pnpm db:studio      # drizzle studio
```

There is no test suite in this repo. `pnpm build` runs database migrations as
a side effect — only run it when that's intended and `DATABASE_URL` is
configured. Do not run destructive database commands unless explicitly asked.

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
containing `/admin`). If you add a new public route, update `publicPages`
here.

Albums use a catch-all route: `app/[locale]/albums/[[...slug]]/page.tsx`
resolves nested album hierarchy from the `slug` segments.

### Auth

Single hardcoded admin user via NextAuth Credentials provider
([auth.ts](auth.ts)), checked against `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars.
JWT session strategy; role (`"admin"`) is threaded through the `jwt` and
`session` callbacks. There is no user table or multi-user support — don't
assume one when working on auth-adjacent code.

### Data model ([app/db/schema.ts](app/db/schema.ts))

Three tables, Drizzle ORM/Postgres:

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

### Proof gallery retention

Once a proof order is marked paid (`proofOrders.confirmedAt` set), the
gallery is auto-deleted 15 days later —
[app/lib/proof-retention.ts](app/lib/proof-retention.ts) defines
`PROOF_RETENTION_DAYS`/`getDaysUntilProofDeletion`, a daily Vercel cron
([vercel.json](vercel.json)) hits
[app/api/cron/delete-expired-proofs](app/api/cron/delete-expired-proofs/route.ts)
(auth'd via `CRON_SECRET`, not the admin session) to delete expired
galleries and their Cloudflare images, and the admin proof-gallery list and
detail pages show a countdown once a gallery is paid. Keep the retention
window in sync across these if it changes.

This cron skips any gallery whose final photos have been published —
ownership of that gallery's deletion passes entirely to the 180-day finals
window instead (see Final photo delivery below), so each gallery has
exactly one deletion countdown, never two. If either retention window
changes, re-check this interaction.

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
Retention mirrors the proof-gallery cron in shape:
[app/lib/final-delivery-retention.ts](app/lib/final-delivery-retention.ts)
(180 days from `finalsPublishedAt`) and a second daily cron,
[app/api/cron/delete-expired-final-deliveries](app/api/cron/delete-expired-final-deliveries/route.ts).
Once finals are published, this cron owns the gallery's entire lifecycle —
it deletes the final photos' R2/Cloudflare assets, the proof photos'
Cloudflare images, and then the `proofGalleries` row itself (cascading
`proofPhotos`/`proofOrders`/`finalPhotos`). Admin UI shows a single
deletion countdown per gallery: the 15-day one before finals are published,
the 180-day one after — never both at once.

### Admin API routes (`app/api/admin/`)

REST-ish route handlers for album/photo CRUD, reordering, and moving photos
between albums (`albums/[id]`, `albums/reorder`, `photos/move`,
`photos/reorder`, `photos/upload-url`). These are protected by the
middleware's admin gate, not by per-route checks — don't assume routes are
locale-prefixed like pages are.

### Env vars

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL` / `POSTGRES_URL`,
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_API_TOKEN`, `GMAIL_USER`,
`GMAIL_PASS` (contact form email delivery via nodemailer), `CRON_SECRET`
(bearer token checked by `app/api/cron/delete-expired-proofs` and
`app/api/cron/delete-expired-final-deliveries`). Final photo delivery
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
