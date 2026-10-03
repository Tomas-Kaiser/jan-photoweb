import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries } from "@/app/db/schema";
import { createPresignedDownloadUrl } from "@/app/lib/r2-client";

type Params = {
  params: Promise<{ token: string; photoId: string }>;
};

// No admin session here — the proof token is the credential, same trust
// model as every other /proof/[token]/* route (see
// docs/photo-proofing-design.md §7a).
export async function GET(_req: Request, { params }: Params) {
  const { token, photoId } = await params;

  const galleryRows = await db
    .select({ id: proofGalleries.id, finalsPublishedAt: proofGalleries.finalsPublishedAt })
    .from(proofGalleries)
    .where(eq(proofGalleries.token, token))
    .limit(1);

  if (!galleryRows.length || !galleryRows[0].finalsPublishedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photoRows = await db
    .select({ r2Key: finalPhotos.r2Key, fileName: finalPhotos.fileName })
    .from(finalPhotos)
    .where(
      and(eq(finalPhotos.id, photoId), eq(finalPhotos.galleryId, galleryRows[0].id)),
    )
    .limit(1);

  if (!photoRows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const url = await createPresignedDownloadUrl(
      photoRows[0].r2Key,
      photoRows[0].fileName,
    );
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to create download URL:", error);
    return NextResponse.json(
      { error: "Failed to create download URL" },
      { status: 500 },
    );
  }
}
