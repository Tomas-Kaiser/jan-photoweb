import { NextResponse } from "next/server";
import { eq, lte } from "drizzle-orm";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries, proofPhotos } from "@/app/db/schema";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";
import { deleteR2Object } from "@/app/lib/r2-client";
import { FINAL_DELIVERY_RETENTION_DAYS } from "@/app/lib/final-delivery-retention";

// This is now the only automatic deletion path for a proof gallery — a
// gallery is never auto-deleted while paid but undelivered (finals not yet
// published), since the photographer may still need time to edit and
// upload them. Deletion only starts counting down once finals are
// published, 180 days later. Deletes both the proof photos' and final
// photos' Cloudflare Images, the final photos' R2 originals, then the
// proofGalleries row itself, which cascades
// proofPhotos/proofOrders/finalPhotos. (Manual deletion via the admin UI's
// "Delete gallery" button remains available at any time regardless.)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - FINAL_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  const expiredGalleries = await db
    .select({ id: proofGalleries.id })
    .from(proofGalleries)
    .where(lte(proofGalleries.finalsPublishedAt, cutoff));

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const gallery of expiredGalleries) {
    try {
      const finals = await db
        .select({ r2Key: finalPhotos.r2Key, previewCloudflareId: finalPhotos.previewCloudflareId })
        .from(finalPhotos)
        .where(eq(finalPhotos.galleryId, gallery.id));

      for (const photo of finals) {
        await deleteR2Object(photo.r2Key);
        await deleteCloudflareImage(photo.previewCloudflareId);
      }

      const proofs = await db
        .select({ cloudflareId: proofPhotos.cloudflareId })
        .from(proofPhotos)
        .where(eq(proofPhotos.galleryId, gallery.id));

      for (const photo of proofs) {
        await deleteCloudflareImage(photo.cloudflareId);
      }

      await db.delete(proofGalleries).where(eq(proofGalleries.id, gallery.id));
      deleted.push(gallery.id);
    } catch (error) {
      console.error("Failed to delete expired final delivery:", {
        galleryId: gallery.id,
        error,
      });
      failed.push(gallery.id);
    }
  }

  return NextResponse.json({ deleted, failed });
}
