import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { finalPhotos } from "@/app/db/schema";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";
import { deleteR2Object } from "@/app/lib/r2-client";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

export const GET = withAdmin(async (req: Request) => {
  const galleryId = new URL(req.url).searchParams.get("galleryId");

  if (!galleryId) {
    return NextResponse.json({ error: "Missing galleryId" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(finalPhotos)
    .where(eq(finalPhotos.galleryId, galleryId));

  return NextResponse.json({ photos: rows });
});

export const POST = withAdmin(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const galleryId = String(body?.galleryId || "").trim();
  const r2Key = String(body?.r2Key || "").trim();
  const fileName = String(body?.fileName || "").trim();
  const previewCloudflareId = String(body?.previewCloudflareId || "").trim();
  const sizeBytes = Number(body?.sizeBytes);
  const width =
    body?.width != null && Number.isFinite(Number(body.width))
      ? Math.round(Number(body.width))
      : null;
  const height =
    body?.height != null && Number.isFinite(Number(body.height))
      ? Math.round(Number(body.height))
      : null;

  if (
    !galleryId ||
    !r2Key ||
    !fileName ||
    !previewCloudflareId ||
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const lifecycle = await loadGalleryLifecycle({ id: galleryId });

  if (!lifecycle) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // Before payment (unless it's direct delivery) there's nothing to deliver
  // yet. Adding finals after publishing stays allowed — they appear for the
  // client right away.
  if (!lifecycle.permissions.canUploadFinals) {
    return NextResponse.json(
      { error: "Final photos can't be uploaded until the client has paid." },
      { status: 409 },
    );
  }

  const [inserted] = await db
    .insert(finalPhotos)
    .values({
      galleryId,
      r2Key,
      fileName,
      sizeBytes: Math.round(sizeBytes),
      previewCloudflareId,
      width,
      height,
      sortOrder: -1,
    })
    .returning({ id: finalPhotos.id });

  return NextResponse.json(
    { success: true, photo: { id: inserted.id } },
    { status: 201 },
  );
});

export const DELETE = withAdmin(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const photoId = String(body?.photoId || "").trim();

  if (!photoId) {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(finalPhotos)
    .where(eq(finalPhotos.id, photoId))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const photo = rows[0];

  const lifecycle = await loadGalleryLifecycle({ id: photo.galleryId });

  if (!lifecycle?.permissions.canDeleteFinals) {
    return NextResponse.json(
      { error: "Final photos can't be deleted after publishing." },
      { status: 409 },
    );
  }

  try {
    await deleteR2Object(photo.r2Key);
    await deleteCloudflareImage(photo.previewCloudflareId);
  } catch (error) {
    console.error("Failed to delete final photo assets:", error);
    return NextResponse.json(
      { error: "Failed to delete photo assets" },
      { status: 502 },
    );
  }

  await db.delete(finalPhotos).where(eq(finalPhotos.id, photoId));

  return NextResponse.json({ success: true });
});
