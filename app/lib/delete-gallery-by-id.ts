import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries, proofPhotos } from "@/app/db/schema";
import { assetStore } from "@/app/lib/asset-store";
import { tearDownGallery } from "@/app/lib/gallery-teardown";

// Loads a gallery's assets and runs them through the teardown module.
// Returns false when no gallery matches. Throws AssetDeletionError when R2
// or Cloudflare refuses a delete, leaving the gallery row in place.
export async function deleteGalleryById(id: string): Promise<boolean> {
  const galleryRows = await db
    .select({
      heroMobileCloudflareId: proofGalleries.heroMobileCloudflareId,
      heroDesktopCloudflareId: proofGalleries.heroDesktopCloudflareId,
    })
    .from(proofGalleries)
    .where(eq(proofGalleries.id, id))
    .limit(1);

  if (!galleryRows.length) return false;

  const proofs = await db
    .select({ cloudflareId: proofPhotos.cloudflareId })
    .from(proofPhotos)
    .where(eq(proofPhotos.galleryId, id));

  const finals = await db
    .select({
      r2Key: finalPhotos.r2Key,
      previewCloudflareId: finalPhotos.previewCloudflareId,
    })
    .from(finalPhotos)
    .where(eq(finalPhotos.galleryId, id));

  await tearDownGallery(
    assetStore,
    {
      ...galleryRows[0],
      proofCloudflareIds: proofs.map((photo) => photo.cloudflareId),
      finals,
    },
    async () => {
      await db.delete(proofGalleries).where(eq(proofGalleries.id, id));
    },
  );

  return true;
}
