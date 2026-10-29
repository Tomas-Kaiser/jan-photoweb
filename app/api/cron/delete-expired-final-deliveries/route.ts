import { NextResponse } from "next/server";
import { lte } from "drizzle-orm";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { deleteGalleryById } from "@/app/lib/delete-gallery-by-id";
import { FINAL_DELIVERY_RETENTION_DAYS } from "@/app/lib/final-delivery-retention";

// This is now the only automatic deletion path for a proof gallery — a
// gallery is never auto-deleted while paid but undelivered (finals not yet
// published), since the photographer may still need time to edit and
// upload them. Deletion only starts counting down once finals are
// published, 356 days later. Each expired gallery goes through the same
// teardown as manual deletion (app/lib/gallery-teardown.ts). (Manual deletion via the admin UI's
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
      await deleteGalleryById(gallery.id);
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
