// The kind of shoot a gallery is for, set by the admin so contacts can be
// segmented by it. Kept free of server imports: the schema's enum and the
// admin's client-side pickers both read GALLERY_EVENT_TYPES.

export const GALLERY_EVENT_TYPES = [
  "wedding",
  "couple",
  "family",
  "portrait",
  "other",
] as const;

export type GalleryEventType = (typeof GALLERY_EVENT_TYPES)[number];

export function parseGalleryEventType(
  value: unknown,
): { ok: true; eventType: GalleryEventType | null } | { ok: false } {
  if (value === null || value === undefined) {
    return { ok: true, eventType: null };
  }
  if (typeof value !== "string") return { ok: false };

  const raw = value.trim();
  if (!raw) return { ok: true, eventType: null };

  const eventType = GALLERY_EVENT_TYPES.find((type) => type === raw);
  return eventType ? { ok: true, eventType } : { ok: false };
}
