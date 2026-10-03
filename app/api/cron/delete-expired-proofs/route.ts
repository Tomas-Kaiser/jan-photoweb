import { NextResponse } from "next/server";
import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";
import { PROOF_RETENTION_DAYS } from "@/app/lib/proof-retention";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - PROOF_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  // Once final photos are published, this gallery's deletion is entirely
  // owned by the 180-day window in delete-expired-final-deliveries instead
  // — a single countdown per gallery, rather than two independent (and
  // confusingly different) ones. This cron only ever touches galleries
  // where finals were never published.
  const expiredGalleries = await db
    .select({ id: proofGalleries.id, clientName: proofGalleries.clientName })
    .from(proofGalleries)
    .innerJoin(proofOrders, eq(proofOrders.galleryId, proofGalleries.id))
    .where(
      and(
        lte(proofOrders.confirmedAt, cutoff),
        isNull(proofGalleries.finalsPublishedAt),
      ),
    );

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const gallery of expiredGalleries) {
    try {
      const galleryPhotos = await db
        .select({ cloudflareId: proofPhotos.cloudflareId })
        .from(proofPhotos)
        .where(eq(proofPhotos.galleryId, gallery.id));

      for (const photo of galleryPhotos) {
        await deleteCloudflareImage(photo.cloudflareId);
      }

      await db.delete(proofGalleries).where(eq(proofGalleries.id, gallery.id));
      deleted.push(gallery.id);
    } catch (error) {
      console.error("Failed to delete expired proof gallery:", {
        galleryId: gallery.id,
        error,
      });
      failed.push(gallery.id);
    }
  }

  return NextResponse.json({ deleted, failed });
}
