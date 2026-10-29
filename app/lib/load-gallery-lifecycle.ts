import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { proofGalleries, proofOrders } from "@/app/db/schema";
import {
  getGalleryPermissions,
  getGalleryStage,
} from "@/app/lib/gallery-lifecycle";

// Loads a proof gallery and its order and runs them through the lifecycle
// module, so API routes take every stage decision from the same place as
// the UI. Returns null when no gallery matches.
export async function loadGalleryLifecycle(
  by: { id: string } | { token: string },
) {
  const galleryRows = await db
    .select()
    .from(proofGalleries)
    .where(
      "id" in by
        ? eq(proofGalleries.id, by.id)
        : eq(proofGalleries.token, by.token),
    )
    .limit(1);

  if (!galleryRows.length) return null;

  const gallery = galleryRows[0];

  const orderRows = await db
    .select()
    .from(proofOrders)
    .where(eq(proofOrders.galleryId, gallery.id))
    .limit(1);

  const order = orderRows[0] ?? null;
  const input = {
    skipProof: gallery.skipProof,
    finalsPublishedAt: gallery.finalsPublishedAt,
    order,
  };

  return {
    gallery,
    order,
    stage: getGalleryStage(input),
    permissions: getGalleryPermissions(input),
  };
}
