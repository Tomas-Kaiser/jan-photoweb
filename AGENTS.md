# Jan PhotoWeb

## Project overview

This is a Next.js 15 photography portfolio and admin application. It uses the
App Router, TypeScript, React 19, Tailwind CSS/DaisyUI, `next-intl`, NextAuth,
PostgreSQL with Drizzle ORM, and Cloudflare Images.

## Repository layout

- `app/[locale]/`: localized public and admin routes.
- `app/components/`: shared UI components.
- `app/api/`: route handlers, including protected admin operations.
- `app/db/schema.ts`: Drizzle schema and relationships.
- `app/db/seed.ts`: development seed data.
- `app/i18n/`: locale routing and request configuration.

## Working conventions

- Prefer server components; add `"use client"` only when browser APIs, state,
  or event handlers require it.
- Keep locale-aware routes under `app/[locale]/` and preserve `next-intl`
  routing behaviour when changing navigation or pages.
- Use TypeScript strictly. Do not introduce `any` (`@typescript-eslint/no-explicit-any`
  is an error).
- Follow existing formatting and component patterns; keep changes focused and
  avoid unrelated refactors.
- Treat database schema and migration changes as deliberate: update
  `app/db/schema.ts`, generate a migration, and do not run destructive database
  commands unless explicitly requested.
- Preserve album hierarchy, photo ordering, and Cloudflare image IDs when
  changing album or photo features.
- Keep secrets in environment variables; never commit credentials, tokens, or
  connection strings.

## Commands

Use `pnpm` (the project has a `pnpm-lock.yaml`):

```bash
pnpm dev
pnpm lint
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

`pnpm build` runs database migrations before `next build`; use it only when
that side effect is intended and the database configuration is available.

## Validation

Run `pnpm lint` after code changes. Run a relevant focused check or build when
the change warrants it, reporting any failure caused by missing environment or
database configuration.
