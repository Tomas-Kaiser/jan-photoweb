import { createHash, createHmac } from "crypto";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries } from "@/app/db/schema";

const ZIP_URL_EXPIRY_SECONDS = 5 * 60;

function hashFileList(files: { key: string; fileName: string }[]): string {
  const serialized = files.map((f) => `${f.key}:${f.fileName}`).join("\n");
  return createHash("sha256").update(serialized).digest("hex");
}

function signRequest(galleryId: string, expires: number, filesHash: string): string {
  return createHmac("sha256", process.env.FINAL_DELIVERY_ZIP_SECRET!)
    .update(`${galleryId}:${expires}:${filesHash}`)
    .digest("hex");
}

type Params = {
  params: Promise<{ token: string }>;
};

// No admin session here — the proof token is the credential, same trust
// model as every other /proof/[token]/* route. Returns the data the client
// needs to POST directly to the delivery-zip Worker (not a redirect — the
// Worker streams the zip body back to the browser itself).
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const galleryRows = await db
    .select({ id: proofGalleries.id, finalsPublishedAt: proofGalleries.finalsPublishedAt })
    .from(proofGalleries)
    .where(eq(proofGalleries.token, token))
    .limit(1);

  if (!galleryRows.length || !galleryRows[0].finalsPublishedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const galleryId = galleryRows[0].id;

  const photoRows = await db
    .select({ r2Key: finalPhotos.r2Key, fileName: finalPhotos.fileName })
    .from(finalPhotos)
    .where(eq(finalPhotos.galleryId, galleryId))
    .orderBy(asc(finalPhotos.sortOrder), asc(finalPhotos.createdAt));

  if (!photoRows.length) {
    return NextResponse.json({ error: "No photos to download" }, { status: 404 });
  }

  const files = photoRows.map((p) => ({ key: p.r2Key, fileName: p.fileName }));
  const expires = Math.floor(Date.now() / 1000) + ZIP_URL_EXPIRY_SECONDS;
  const sig = signRequest(galleryId, expires, hashFileList(files));

  return NextResponse.json({
    workerUrl: process.env.FINAL_DELIVERY_WORKER_URL,
    galleryId,
    expires,
    sig,
    files,
  });
}
