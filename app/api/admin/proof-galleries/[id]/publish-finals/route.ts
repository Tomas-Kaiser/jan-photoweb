import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries, proofOrders } from "@/app/db/schema";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withAdmin(async (_req: Request, { params }: Params) => {
  try {
    const { id } = await params;

    const galleryRows = await db
      .select({
        finalsPublishedAt: proofGalleries.finalsPublishedAt,
        skipProof: proofGalleries.skipProof,
      })
      .from(proofGalleries)
      .where(eq(proofGalleries.id, id))
      .limit(1);

    if (!galleryRows.length) {
      return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
    }

    if (galleryRows[0].finalsPublishedAt) {
      return NextResponse.json({ success: true });
    }

    if (!galleryRows[0].skipProof) {
      const orderRows = await db
        .select({ status: proofOrders.status })
        .from(proofOrders)
        .where(eq(proofOrders.galleryId, id))
        .limit(1);

      if (!orderRows.length || orderRows[0].status !== "paid") {
        return NextResponse.json(
          { error: "The client hasn't paid for this gallery yet." },
          { status: 409 },
        );
      }
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
