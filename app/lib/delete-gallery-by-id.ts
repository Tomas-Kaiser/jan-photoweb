import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/app/db";
import {
  clients,
  finalPhotos,
  galleryClients,
  proofGalleries,
  proofPhotos,
} from "@/app/db/schema";
import { assetStore } from "@/app/lib/asset-store";
import { tearDownGallery } from "@/app/lib/gallery-teardown";

// Loads a gallery's assets and runs them through the teardown module,
// which also removes clients the deletion leaves orphaned. Returns false
// when no gallery matches. Throws AssetDeletionError when R2
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
    {
      async deleteGallery(chooseClientsToDelete) {
        await db.transaction(async (tx) => {
          // Lock the gallery, then its clients in id order: the same order
          // completeRegistration locks in, so the two can't deadlock, and
          // nobody can join or consent until this commits.
          await tx
            .select({ id: proofGalleries.id })
            .from(proofGalleries)
            .where(eq(proofGalleries.id, id))
            .for("update");
          await tx
            .select({ id: clients.id })
            .from(clients)
            .where(
              inArray(
                clients.id,
                tx
                  .select({ id: galleryClients.clientId })
                  .from(galleryClients)
                  .where(eq(galleryClients.galleryId, id)),
              ),
            )
            .orderBy(clients.id)
            .for("update");

          // Read only once the locks are held, so a gallery deleted or
          // joined by another transaction in the meantime is seen.
          const linkedClients = await tx
            .select({
              id: clients.id,
              marketingConsentAt: clients.marketingConsentAt,
              hasOtherGalleries: sql<boolean>`exists (
                select 1 from ${galleryClients}
                where ${galleryClients.clientId} = ${clients.id}
                and ${galleryClients.galleryId} <> ${id}
              )`,
            })
            .from(galleryClients)
            .innerJoin(clients, eq(clients.id, galleryClients.clientId))
            .where(eq(galleryClients.galleryId, id));

          const orphanedClientIds = chooseClientsToDelete(
            linkedClients.map(({ marketingConsentAt, ...client }) => ({
              ...client,
              hasMarketingConsent: marketingConsentAt !== null,
            })),
          );

          await tx.delete(proofGalleries).where(eq(proofGalleries.id, id));
          if (orphanedClientIds.length) {
            await tx.delete(clients).where(inArray(clients.id, orphanedClientIds));
          }
        });
      },
    },
  );

  return true;
}
