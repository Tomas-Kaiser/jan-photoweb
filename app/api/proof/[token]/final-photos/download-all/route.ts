import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { finalPhotos } from "@/app/db/schema";
import { finalPhotoOrder } from "@/app/lib/final-photo-order";
import {
  clientGalleryNotFound,
  loadClientGallery,
} from "@/app/lib/client-gallery";
import { signZipRequest } from "@/app/lib/zip-signature";

const ZIP_URL_EXPIRY_SECONDS = 5 * 60;

type Params = {
  params: Promise<{ token: string }>;
};

// No admin session here — the proof token is the credential, same trust
// model as every other /proof/[token]/* route. Returns the data the client
// needs to POST directly to the delivery-zip Worker (not a redirect — the
// Worker streams the zip body back to the browser itself).
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const clientGallery = await loadClientGallery(token);

  if (!clientGallery?.permissions.canClientDownload) {
    return clientGalleryNotFound();
  }

  const galleryId = clientGallery.gallery.id;

  const photoRows = await db
    .select({ r2Key: finalPhotos.r2Key, fileName: finalPhotos.fileName })
    .from(finalPhotos)
    .where(eq(finalPhotos.galleryId, galleryId))
    .orderBy(...finalPhotoOrder);

  if (!photoRows.length) {
    return NextResponse.json({ error: "No photos to download" }, { status: 404 });
  }

  const files = photoRows.map((p) => ({ key: p.r2Key, fileName: p.fileName }));
  const expires = Math.floor(Date.now() / 1000) + ZIP_URL_EXPIRY_SECONDS;
  const sig = await signZipRequest(
    { galleryId, expires, files },
    process.env.FINAL_DELIVERY_ZIP_SECRET!,
  );

  return NextResponse.json({
    workerUrl: process.env.FINAL_DELIVERY_WORKER_URL,
    galleryId,
    expires,
    sig,
    files,
  });
}
