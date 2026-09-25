import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";

type Params = {
  params: Promise<{ id: string }>;
};

async function requireAdmin() {
  const session = await auth();
  return (
    !!session?.user && (session.user as { role?: string }).role === "admin"
  );
}

export async function POST(req: Request, { params }: Params) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: galleryId } = await params;
    const body = await req.json();

    const cloudflareId = String(body?.cloudflareId || "").trim();
    const fileName = String(body?.fileName || "").trim();

    if (!cloudflareId || !fileName) {
      return NextResponse.json(
        { error: "Missing cloudflareId or fileName." },
        { status: 400 },
      );
    }

    const galleryRows = await db
      .select({ id: proofGalleries.id })
      .from(proofGalleries)
      .where(eq(proofGalleries.id, galleryId))
      .limit(1);

    if (!galleryRows.length) {
      return NextResponse.json(
        { error: "Proof gallery not found." },
        { status: 404 },
      );
    }

    const [inserted] = await db
      .insert(proofPhotos)
      .values({
        galleryId,
        cloudflareId,
        fileName,
        sortOrder: -1,
      })
      .returning({ id: proofPhotos.id });

    return NextResponse.json(
      { success: true, photo: { id: inserted.id } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/proof-galleries/[id]/photos failed:", error);
    return NextResponse.json(
      { error: "Failed to save photo." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const photoId = String(body?.photoId || "").trim();

    if (!photoId) {
      return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
    }

    const photoRows = await db
      .select({
        id: proofPhotos.id,
        galleryId: proofPhotos.galleryId,
        cloudflareId: proofPhotos.cloudflareId,
      })
      .from(proofPhotos)
      .where(eq(proofPhotos.id, photoId))
      .limit(1);

    if (!photoRows.length) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const submittedOrder = await db
      .select({ id: proofOrders.id })
      .from(proofOrders)
      .where(eq(proofOrders.galleryId, photoRows[0].galleryId))
      .limit(1);

    if (submittedOrder.length) {
      return NextResponse.json(
        { error: "Photos can't be deleted after the client has submitted." },
        { status: 409 },
      );
    }

    try {
      await deleteCloudflareImage(photoRows[0].cloudflareId);
    } catch {
      return NextResponse.json(
        { error: "Failed to delete image from Cloudflare" },
        { status: 502 },
      );
    }

    await db.delete(proofPhotos).where(eq(proofPhotos.id, photoId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "DELETE /api/admin/proof-galleries/[id]/photos failed:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to delete photo." },
      { status: 500 },
    );
  }
}
