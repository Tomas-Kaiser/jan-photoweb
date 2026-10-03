import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { createPresignedUploadUrl } from "@/app/lib/r2-client";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Unlike the Cloudflare Images upload-url flow (app/api/admin/photos/upload-url),
// the client uploads here with a raw PUT of the file body — not a multipart
// FormData POST. See uploadOriginalToR2 in FinalPhotosSection.tsx.
export async function POST(req: Request) {
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const galleryRows = await db
    .select({ id: proofGalleries.id })
    .from(proofGalleries)
    .where(eq(proofGalleries.id, galleryId))
    .limit(1);

  if (!galleryRows.length) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const r2Key = `finals/${galleryId}/${randomUUID()}-${sanitizeFileName(fileName)}`;

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
}
