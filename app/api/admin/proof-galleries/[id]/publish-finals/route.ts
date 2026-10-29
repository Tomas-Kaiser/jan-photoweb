import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries } from "@/app/db/schema";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withAdmin(async (_req: Request, { params }: Params) => {
  try {
    const { id } = await params;

    const lifecycle = await loadGalleryLifecycle({ id });

    if (!lifecycle) {
      return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
    }

    // Already published — a repeated click is a no-op, not an error.
    if (lifecycle.stage === "delivered") {
      return NextResponse.json({ success: true });
    }

    if (!lifecycle.permissions.canPublishFinals) {
      return NextResponse.json(
        { error: "The client hasn't paid for this gallery yet." },
        { status: 409 },
      );
    }

    const photoCount = await db
      .select({ id: finalPhotos.id })
      .from(finalPhotos)
      .where(eq(finalPhotos.galleryId, id));

    if (!photoCount.length) {
      return NextResponse.json(
        { error: "Upload at least one final photo before publishing." },
        { status: 409 },
      );
    }

    await db
      .update(proofGalleries)
      .set({ finalsPublishedAt: new Date() })
      .where(eq(proofGalleries.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "POST /api/admin/proof-galleries/[id]/publish-finals failed:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to publish finals." },
      { status: 500 },
    );
  }
});
