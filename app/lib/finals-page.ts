import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries } from "@/app/db/schema";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { finalPhotoOrder } from "@/app/lib/final-photo-order";
import { getFinalDeliveryDeletionDate } from "@/app/lib/final-delivery-retention";

type Gallery = typeof proofGalleries.$inferSelect;

// Everything the finals page shows, loaded the same way for the client's
// link and the admin's preview of it, so the preview can't drift from what
// the client actually sees.
export async function loadFinalsPageContent(gallery: Gallery, locale: string) {
  const finalPhotoRows = await db
    .select()
    .from(finalPhotos)
    .where(eq(finalPhotos.galleryId, gallery.id))
    .orderBy(...finalPhotoOrder);

  const photos = finalPhotoRows.map((photo) => ({
    id: photo.id,
    fileName: photo.fileName,
    // "detail" (not "card") for the gallery grid itself — the justified
    // layout needs each tile's real aspect ratio, and "card" has
    // historically only ever been used for forced-square crops
    // elsewhere in this app, so it isn't trustworthy here.
    gridSrc: getCloudflareImageUrl(photo.previewCloudflareId, "detail"),
    detailSrc: getCloudflareImageUrl(photo.previewCloudflareId, "detail"),
    fullSrc: getCloudflareImageUrl(photo.previewCloudflareId, "full"),
    width: photo.width ?? 1200,
    height: photo.height ?? 1200,
  }));

  return {
    clientName: gallery.clientName,
    eventDateLabel: gallery.eventDate
      ? gallery.eventDate.toLocaleDateString(locale, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null,
    finalsMessage: gallery.finalsMessage,
    deletionDateLabel: gallery.finalsPublishedAt
      ? getFinalDeliveryDeletionDate(
          gallery.finalsPublishedAt,
        ).toLocaleDateString(locale, {
          dateStyle: "long",
          timeZone: "Europe/Prague",
        })
      : null,
    photos,
    heroMobileSrc: gallery.heroMobileCloudflareId
      ? getCloudflareImageUrl(gallery.heroMobileCloudflareId, "full")
      : null,
    heroDesktopSrc: gallery.heroDesktopCloudflareId
      ? getCloudflareImageUrl(gallery.heroDesktopCloudflareId, "full")
      : null,
  };
}
