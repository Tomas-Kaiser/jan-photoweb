import type { routing } from "@/app/i18n/routing";

// Absolute admin link for emails, built from the configured site URL
// (NEXT_PUBLIC_SITE_URL) rather than the request's Host header.
export function getAdminProofGalleryUrl(
  siteUrl: string,
  locale: (typeof routing.locales)[number],
  galleryId: string,
) {
  return `${siteUrl.replace(/\/$/, "")}/${locale}/admin/proof-galleries/${galleryId}`;
}
