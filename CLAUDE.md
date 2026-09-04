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

### Admin API routes (`app/api/admin/`)

REST-ish route handlers for album/photo CRUD, reordering, and moving photos
between albums (`albums/[id]`, `albums/reorder`, `photos/move`,
`photos/reorder`, `photos/upload-url`). These are protected by the
middleware's admin gate, not by per-route checks — don't assume routes are
locale-prefixed like pages are.

### Env vars

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL` / `POSTGRES_URL`,
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_API_TOKEN`, `GMAIL_USER`,
`GMAIL_PASS` (contact form email delivery via nodemailer). Keep these in
`.env.local`; never commit them.

## Conventions

- Prefer server components; add `"use client"` only when browser APIs,
  state, or event handlers require it.
- TypeScript strict mode; `@typescript-eslint/no-explicit-any` is an eslint
  error — don't introduce `any`.
- Keep changes focused; follow existing formatting/component patterns rather
  than introducing new ones.
