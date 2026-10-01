import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries, proofPhotos } from "@/app/db/schema";
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

export async function PATCH(req: Request, { params }: Params) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updates: Partial<typeof proofGalleries.$inferInsert> = {};

    if ("message" in body) {
      const message = typeof body.message === "string" ? body.message.trim() : "";
      updates.message = message || null;
    }

    const hasSettingsFields =
      "clientName" in body ||
      "baseCostCents" in body ||
      "freePhotoCount" in body ||
      "extraPhotoPriceCents" in body;

    if (hasSettingsFields) {
      const clientName = String(body?.clientName || "").trim();
      const baseCostCents = Number(body?.baseCostCents ?? 0);
      const freePhotoCount = Number(body?.freePhotoCount);
      const extraPhotoPriceCents = Number(body?.extraPhotoPriceCents);

      if (!clientName) {
        return NextResponse.json(
          { error: "Client name is required." },
          { status: 400 },
        );
      }

      if (!Number.isInteger(baseCostCents) || baseCostCents < 0) {
        return NextResponse.json(
          { error: "Base cost must be a non-negative whole number." },
          { status: 400 },
        );
      }

      if (!Number.isInteger(freePhotoCount) || freePhotoCount < 0) {
        return NextResponse.json(
          { error: "Free photo count must be a non-negative whole number." },
          { status: 400 },
        );
      }

      if (!Number.isInteger(extraPhotoPriceCents) || extraPhotoPriceCents < 0) {
        return NextResponse.json(
          { error: "Extra photo price must be a non-negative whole number." },
          { status: 400 },
        );
      }

      updates.clientName = clientName;
      updates.baseCostCents = baseCostCents;
      updates.freePhotoCount = freePhotoCount;
      updates.extraPhotoPriceCents = extraPhotoPriceCents;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 },
      );
    }

    const updated = await db
      .update(proofGalleries)
      .set(updates)
      .where(eq(proofGalleries.id, id))
      .returning({ id: proofGalleries.id });

    if (!updated.length) {
      return NextResponse.json(
        { error: "Proof gallery not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/proof-galleries/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update proof gallery." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const galleryRows = await db
      .select({ id: proofGalleries.id })
      .from(proofGalleries)
      .where(eq(proofGalleries.id, id))
      .limit(1);

    if (!galleryRows.length) {
      return NextResponse.json(
        { error: "Proof gallery not found." },
        { status: 404 },
      );
    }

    const galleryPhotos = await db
      .select({ cloudflareId: proofPhotos.cloudflareId })
      .from(proofPhotos)
      .where(eq(proofPhotos.galleryId, id));

    for (const photo of galleryPhotos) {
      try {
        await deleteCloudflareImage(photo.cloudflareId);
      } catch (error) {
        console.error("Failed to delete proof photo from Cloudflare:", {
          cloudflareId: photo.cloudflareId,
          error,
        });
        return NextResponse.json(
          { error: "Failed to delete one or more photos from Cloudflare." },
          { status: 502 },
        );
      }
    }

    await db.delete(proofGalleries).where(eq(proofGalleries.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/proof-galleries/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete proof gallery." },
      { status: 500 },
    );
  }
}
