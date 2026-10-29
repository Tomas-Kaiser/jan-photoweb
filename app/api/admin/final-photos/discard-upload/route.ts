import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import {
  albums,
  finalPhotos,
  photos,
  proofGalleries,
  proofPhotos,
} from "@/app/db/schema";
import { assetStore } from "@/app/lib/asset-store";
import { deleteFinalPhotoAssets } from "@/app/lib/gallery-teardown";
import { finalR2KeyPrefix } from "@/app/lib/r2-client";

// Anything other than a final photo that uses this Cloudflare image — a
// discard must never delete an album cover, portfolio photo, proof photo or
// gallery hero, whatever id the browser sends.
async function isImageUsedOutsideFinals(cloudflareId: string) {
  const usages = await Promise.all([
    db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.coverCloudflareId, cloudflareId))
      .limit(1),
    db
      .select({ id: photos.id })
      .from(photos)
      .where(eq(photos.cloudflareId, cloudflareId))
      .limit(1),
    db
      .select({ id: proofPhotos.id })
      .from(proofPhotos)
      .where(eq(proofPhotos.cloudflareId, cloudflareId))
      .limit(1),
    db
      .select({ id: proofGalleries.id })
      .from(proofGalleries)
      .where(
        or(
          eq(proofGalleries.heroMobileCloudflareId, cloudflareId),
          eq(proofGalleries.heroDesktopCloudflareId, cloudflareId),
        ),
      )
      .limit(1),
  ]);

  return usages.some((rows) => rows.length > 0);
}

// Called by the browser when a final photo upload fails partway (see
// app/utils/upload-final-photo.ts), to delete the preview and/or R2 original
// that attempt already uploaded. `r2Key` is absent if the upload never got an
// R2 URL.
export const POST = withAdmin(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const galleryId = String(body?.galleryId || "").trim();
  const previewCloudflareId = String(body?.previewCloudflareId || "").trim();
  const r2Key = String(body?.r2Key || "").trim() || undefined;

  if (
    !galleryId ||
    !previewCloudflareId ||
    (r2Key && !r2Key.startsWith(finalR2KeyPrefix(galleryId)))
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  const [gallery] = await db
    .select({ id: proofGalleries.id })
    .from(proofGalleries)
    .where(eq(proofGalleries.id, galleryId))
    .limit(1);

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // A registration whose response was lost may still have saved the row.
  // Its assets stay, and the id lets the browser treat the upload as done
  // instead of offering a retry that would duplicate it.
  const [saved] = await db
    .select({ id: finalPhotos.id })
    .from(finalPhotos)
    .where(
      r2Key
        ? or(
            eq(finalPhotos.previewCloudflareId, previewCloudflareId),
            eq(finalPhotos.r2Key, r2Key),
          )
        : eq(finalPhotos.previewCloudflareId, previewCloudflareId),
    )
    .limit(1);

  if (saved) {
    return NextResponse.json(
      {
        error: "These assets belong to a saved final photo.",
        photoId: saved.id,
      },
      { status: 409 },
    );
  }

  if (await isImageUsedOutsideFinals(previewCloudflareId)) {
    return NextResponse.json(
      { error: "This image is in use elsewhere." },
      { status: 409 },
    );
  }

  try {
    await deleteFinalPhotoAssets(assetStore, { r2Key, previewCloudflareId });
  } catch (error) {
    console.error("Failed to discard final photo upload:", error);
    return NextResponse.json(
      { error: "Failed to delete photo assets" },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
});
