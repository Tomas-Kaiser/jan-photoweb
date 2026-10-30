import { NextResponse } from "next/server";
import { lte } from "drizzle-orm";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { deleteGalleryById } from "@/app/lib/delete-gallery-by-id";
import { getFinalDeliveryExpiryCutoff } from "@/app/lib/final-delivery-retention";
import { sendDueDeletionReminders } from "@/app/lib/send-deletion-reminders";

// This is now the only automatic deletion path for a proof gallery — a
// gallery is never auto-deleted while paid but undelivered (finals not yet
// published), since the photographer may still need time to edit and
// upload them. Deletion only starts counting down once finals are
// published, 365 days later. Each expired gallery goes through the same
// teardown as manual deletion (app/lib/gallery-teardown.ts). (Manual deletion via the admin UI's
// "Delete gallery" button remains available at any time regardless.)
// After deleting, the same run emails owners their 30- and 7-day deletion
// reminders (app/lib/send-deletion-reminders.ts).
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = getFinalDeliveryExpiryCutoff();

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

  // Reminders run after deletions, so a reminder failure can't hold up a
  // deletion.
  let reminders: { sent: string[]; failed: string[] } | { error: true };
  try {
    reminders = await sendDueDeletionReminders({
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin,
    });
  } catch (error) {
    console.error("Failed to send deletion reminders:", error);
    reminders = { error: true };
  }

  return NextResponse.json({ deleted, failed, reminders });
}
