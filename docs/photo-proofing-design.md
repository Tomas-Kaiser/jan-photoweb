# Photo Proofing & Selection — Design Doc

## 1. Problem

Jan currently uses a third-party service (e.g. [nahledovky.cz](https://nahledovky.cz))
to deliver watermarked proofs to clients after a shoot, let them pick their
favorites, cap the free selection at N photos, charge for extras, and collect
payment via QR code / bank transfer. This doc scopes building that workflow
directly into jan-photoweb, reusing the existing Cloudflare Images pipeline
and admin surface instead of a separate paid tool.

### Naming

Sticking with "proof" / "proofing gallery" throughout (tables, routes,
English UI copy) rather than "preview" — it's the actual term of art for
this workflow (ShootProof, Pixieset's "proofing galleries," etc.), and this
app's only audience is a photographer who already thinks in those terms. For
the `cs` locale, use "náhledovka" (singular) / "náhledovky" (plural) — the
colloquial Czech term for exactly this kind of proof gallery, and where
nahledovky.cz's own name comes from — rather than a literal translation of
"proof."

## 2. Reference workflow (nahledovky.cz)

1. Photographer uploads a shoot's photos into an album; previews are
   watermarked and download-locked.
2. Photographer sets: number of photos included in the base package, and a
   price per additional photo.
3. Client gets a shareable link, opens it on any device, and taps to select
   favorites.
4. On submission, the app shows the total instantly (included + extras).
5. Client pays via QR code / bank transfer (Comgate gateway reconciles
   payment automatically).
6. Photographer delivers final edited images once paid.

## 3. Goals / non-goals

**Goals (v1)**
- Photographer can create a "proofing gallery" for a shoot, upload photos to
  it, and set a free-photo count + price-per-extra-photo.
- Client opens a link (no login) and selects photos, sees a running count
  and the extra cost in real time, then submits.
- Client can leave a short free-text comment on any individual photo
  (selected or not) — e.g. "crop tighter," "prefer black-and-white" —
  visible to the photographer alongside the selection. Deliberately just a
  single text field per photo, not pinned/located comments or color labels
  (cf. Selekt) — that granularity fits a multi-round agency review, not a
  one-shot client selection.
- Photographer sees the submitted selection, the computed total, and can
  mark it paid.
- Previews are watermarked and not downloadable at full resolution before
  payment.
- Photographer can get the original filenames of the selected photos as a
  plain-text list to paste into Lightroom's filter/search box, so he can
  re-select the same photos there and start editing — see §7b.
- Works in both locales (`en`, `cs`), matches existing UI conventions.

**Non-goals (v1)**
- Automatic payment reconciliation (bank/gateway webhook). v1 payment is
  "show a QR code, photographer confirms manually" — see §7.
- Multiple clients per gallery, accounts, or client login.
- Retouching/print add-ons, booking calendar, statistics dashboard (all
  things nahledovky also offers but are separate features, not required to
  replace the core "select & pay" flow).

## 4. Why not extend `albums`/`photos`

`albums`/`photos` are the load-bearing schema for the *public portfolio*
(tree structure, `sortOrder`, `visibility`). Proofing galleries are a
different lifecycle: private, temporary, tied to a single client, deleted or
archived after delivery. Bolting this onto `albums` would mean overloading
`visibility` and risking the ordering/id guarantees CLAUDE.md calls out as
load-bearing elsewhere. This design adds **new, independent tables** instead.

## 5. Data model (Drizzle / Postgres)

```ts
// app/db/schema.ts (additive — new tables only)

export const proofGalleries = pgTable("proof_galleries", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(), // random slug, e.g. nanoid(12)
  clientName: text("client_name"),
  freePhotoCount: integer("free_photo_count").notNull().default(10),
  extraPhotoPriceCents: integer("extra_photo_price_cents").notNull(),
  currency: text("currency").notNull().default("CZK"),
  status: text("status", { enum: ["draft", "active", "submitted", "paid", "closed"] })
    .notNull()
    .default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const proofPhotos = pgTable("proof_photos", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id")
    .notNull()
    .references(() => proofGalleries.id, { onDelete: "cascade" }),
  cloudflareId: text("cloudflare_id").notNull(),
  fileName: text("file_name").notNull(), // original filename as shot by the camera, e.g. "DSC_4821.jpg" — needed to round-trip into Lightroom, see §7b
  sortOrder: integer("sort_order").notNull().default(0),
  selected: boolean("selected").notNull().default(false),
  selectedAt: timestamp("selected_at"),
  comment: text("comment"), // optional free-text client note, e.g. "crop tighter" — not pinned/located, see §3
});

export const proofOrders = pgTable("proof_orders", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id")
    .notNull()
    .references(() => proofGalleries.id, { onDelete: "cascade" }),
  selectedPhotoIds: jsonb("selected_photo_ids").notNull(), // snapshot at submit time
  includedCount: integer("included_count").notNull(),
  extraCount: integer("extra_count").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status", { enum: ["pending_payment", "paid"] })
    .notNull()
    .default("pending_payment"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});
```

Notes:
- One gallery = one client/shoot, matching nahledovky's model — no
  multi-client selection tables needed.
- `selected` lives directly on `proofPhotos` since only one client ever
  toggles it; a future multi-viewer scenario would need a separate
  selections table, but that's out of scope.
- `proofOrders` keeps a snapshot (`selectedPhotoIds`) at submit time. Per
  §7a the selection is one-shot — once an order exists for a gallery, the
  client-facing route is read-only, so there's no re-submit case to handle.
- `fileName` is captured at upload time (from the browser `File.name`, before
  the file goes to Cloudflare) — it must match what Lightroom shows for that
  shoot's imported catalog (same base name, RAW or exported JPEG) or the
  copy-paste handoff in §7b won't line up.

## 6. Routes

### Admin (`app/api/admin/proof-galleries/...`, protected by existing middleware gate)
- `POST /api/admin/proof-galleries` — create gallery (name, free count, extra price).
- `POST /api/admin/proof-galleries/[id]/photos/upload-url` — reuse the
  existing direct-creator-upload flow from `photos/upload-url`.
- `GET /api/admin/proof-galleries/[id]` — gallery + photos + latest order.
- `POST /api/admin/proof-galleries/[id]/mark-paid` — manual payment confirmation.
- `DELETE /api/admin/proof-galleries/[id]` — cleanup after delivery.

### Client-facing (public, token-based, no auth)
- `app/[locale]/proof/[token]/page.tsx` — selection UI. Needs to be added to
  `publicPages` in [middleware.ts](../middleware.ts) (locale-aware, like
  `/` and `/admin/login`) since it has no session.
- `POST /api/proof/[token]/submit` — submit selection (and any per-photo
  comments), compute total, create `proofOrders` row. Validated server-side
  against `freePhotoCount` / `extraPhotoPriceCents` — never trust a
  client-computed total. Comments are plain text, capped at a reasonable
  length server-side, and stored as-is (no HTML/markdown rendering).
- Once a gallery has a `proofOrders` row (i.e. `status` is `submitted` or
  later), the selection page becomes **read-only**: photos still render, but
  toggling and re-submitting are rejected server-side. This is the link's
  only access control beyond the token itself — see §7b.

### Admin UI

There is no per-feature button in the top navbar — the admin bar there only
ever shows generic "Dashboard" / "Logout" links (see [NavBar.tsx](../app/[locale]/NavBar.tsx)).
Individual features surface as cards on the `/admin` dashboard page instead
(see [admin/page.tsx](../app/[locale]/admin/page.tsx), where "Albums" and
"Portfolio Highlights" already work this way):

1. A new **"Proof Galleries"** card on `/admin`, alongside Albums and
   Portfolio Highlights, linking to `/admin/proof-galleries`.
2. `/admin/proof-galleries` — list of galleries (client name, status badge:
   draft/submitted/paid) with a "New gallery" action.
3. `/admin/proof-galleries/[id]` — detail/creation page:
   - Set client name, free-photo count, price-per-extra-photo.
   - Upload photos (reuses the existing Cloudflare direct-creator-upload flow).
   - Shows the shareable client link (`/proof/<token>`) with a copy button —
     the app never sends it itself; the photographer shares it however he
     normally would (email, WhatsApp, etc.).
   - Once the client has submitted: shows the selected photos (with any
     client comment displayed under each thumbnail), the server-computed
     total, a "mark paid" button, and the "copy filenames" button for the
     Lightroom handoff (§7b).

## 7. Watermarking & delivery

Cloudflare Images already gives us `getCloudflareImageUrl(cloudflareId, variant)`
with `card | detail | full` variants. Add a `proof` variant configured in
Cloudflare with a visible watermark overlay (Cloudflare Images supports
draft/watermark variants) and a resolution cap well below print quality.
Client-facing selection UI only ever requests the `proof` variant; the `full`
variant is only ever served from admin-authenticated routes, post-payment.

## 7a. Link security

The client link has no login — access is the token itself (`proofGalleries.token`),
same model as Google Docs/Dropbox share links and what nahledovky.cz itself
uses. This is an accepted tradeoff, not a gap, as long as two things hold:

- **The token is genuinely unguessable.** Generate it with a CSPRNG
  (`nanoid()`, default alphabet, 16+ chars) — never a sequential id or a
  predictable slug like the client's name.
- **A leaked link can't be used to tamper with an already-placed order.**
  Once the client has submitted a selection, the route becomes read-only (see
  §6) — so if the link is forwarded, screenshotted, or otherwise leaks after
  that point, the worst case is someone viewing watermarked previews and the
  order summary, not altering what's been selected or re-triggering payment.

Explicitly out of scope for v1: a PIN/passcode on top of the link, and link
expiry. Both are easy to add later (a `passcode` column + a check before
rendering, or an `expiresAt` cutoff already sketched on `proofGalleries`) if
this ever needs to be locked down further than "unguessable link."

## 7b. Filename handoff to Lightroom

The photographer's post-selection step happens outside this app: he opens
Lightroom (where the shoot is already imported), pastes a list of filenames
into the Library filter/search bar, and it re-selects exactly those photos so
he can start editing only the ones the client picked.

To support that:
- The admin gallery detail page shows the submitted order's selected photos
  with their `fileName`.
- A "Copy filenames" button copies them to the clipboard as a plain
  newline-separated list (one filename per line — matches how Lightroom's
  Library Filter "Text → Filename" search and most "select by list" plugins
  expect pasted input). Also offer a "Download .txt" fallback for browsers
  where clipboard access is restricted.
- Include the extension exactly as uploaded (`DSC_4821.jpg`) rather than
  stripping it, since that's what will match Lightroom's catalog.

This is copy-paste, not an API integration — Lightroom has no public API for
this, so there's no round-trip beyond "hand the photographer a clean text
list."

## 8. Payment (staged)

**v1 — manual confirmation, QR code for UX only.**
Czech bank QR payments use the open **SPAYD** text format
(`SPD*1.0*ACC:<iban>*AM:<amount>*CC:CZK*MSG:<note>`), which can be rendered
to a QR code client-side with no payment gateway — this gets the "scan to
pay" UX nahledovky has without any integration work. The photographer checks
their bank account and clicks "mark paid" in the admin UI; `proofOrders.status`
flips to `paid` manually. Good enough for one photographer's volume.

**v2 — automatic reconciliation (future, not in this doc's scope).**
Wire a real payment gateway (Comgate is the Czech-market equivalent
nahledovky uses) so a webhook flips `proofOrders.status` to `paid`
automatically. Meaningfully more work: gateway account, webhook route,
signature verification, idempotency, handling partial/failed payments. Only
worth it if manual confirmation becomes a bottleneck.

## 9. Client-side selection UX

- Grid of watermarked photos, tap/click to toggle selection (checkmark
  overlay), running counter: "7 / 10 included, 2 extra × 150 Kč = 300 Kč".
  extra cost updates client-side for responsiveness but is **recomputed and
  enforced server-side** on submit.
- Each photo has an optional comment icon/affordance that expands a plain
  text field (not tied to selection state — a client can comment on a photo
  without selecting it). No pinning, drawing, or per-region markup.
- "Submit selection" is a confirmation step (dialog, reuse existing
  `ConfirmDialog` component) since it's a one-shot action per §5.
- After submit: read-only summary screen with total + (v1) SPAYD QR code +
  payment instructions.

## 10. Rollout

1. Schema migration (`pnpm db:generate` + review) for the three new tables.
2. Admin: create gallery + upload photos (reuses existing upload flow).
3. Public selection page + submit endpoint with server-side total enforcement.
4. Manual "mark paid" in admin, plus "copy filenames" for the Lightroom handoff.
5. SPAYD QR rendering on the client submit-confirmation screen.
6. (Later, only if needed) Payment gateway integration for auto-reconciliation.

## 11. Open questions

- Gallery expiry: auto-close/delete after N days, or manual only? (Out of
  scope for v1 per §7a — link security relies on read-only-after-submit, not
  expiry.)
- Does "extra photo" pricing ever vary per-gallery beyond a flat per-photo
  rate (e.g. tiered pricing)? v1 assumes a single flat rate per gallery.
- Does the photographer need the filename list available *before* payment
  (to start culling/editing early) or only after `mark-paid`? Affects
  whether "copy filenames" is gated on order status or always available
  once a selection is submitted.
