import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withAdmin } from "@/app/lib/with-admin";
import {
  createPresignedUploadUrl,
  finalR2KeyPrefix,
} from "@/app/lib/r2-client";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Unlike the Cloudflare Images upload-url flow (app/api/admin/photos/upload-url),
// the client uploads here with a raw PUT of the file body — not a multipart
// FormData POST. See app/utils/upload-final-photo.ts.
export const POST = withAdmin(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const galleryId = String(body?.galleryId || "").trim();
  const fileName = String(body?.fileName || "").trim();
  const contentType = String(body?.contentType || "application/octet-stream");

  if (!galleryId || !fileName) {
    return NextResponse.json(
      { error: "Missing galleryId or fileName" },
      { status: 400 },
    );
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

  const r2Key = `${finalR2KeyPrefix(galleryId)}${randomUUID()}-${sanitizeFileName(fileName)}`;

  try {
    const uploadURL = await createPresignedUploadUrl(r2Key, contentType);
    return NextResponse.json({ r2Key, uploadURL });
  } catch (error) {
    console.error("Failed to create R2 upload URL:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }
});
