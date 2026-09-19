import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";

type Params = {
  params: Promise<{ token: string }>;
};

type PhotoSelection = {
  photoId: string;
  selected: boolean;
  comment: string | null;
};

const MAX_COMMENT_LENGTH = 500;

function normalizeSelections(body: unknown): PhotoSelection[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { photos?: unknown }).photos)) {
    return null;
  }

  const photos = (body as { photos: unknown[] }).photos;
  const selections: PhotoSelection[] = [];

  for (const entry of photos) {
    if (!entry || typeof entry !== "object") return null;

    const photoId = String((entry as { photoId?: unknown }).photoId || "").trim();
    const selected = Boolean((entry as { selected?: unknown }).selected);
    const rawComment = (entry as { comment?: unknown }).comment;
    const comment =
      typeof rawComment === "string" && rawComment.trim()
        ? rawComment.trim().slice(0, MAX_COMMENT_LENGTH)
        : null;

    if (!photoId) return null;

    selections.push({ photoId, selected, comment });
  }

  return selections;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;

    const galleryRows = await db
      .select()
      .from(proofGalleries)
      .where(eq(proofGalleries.token, token))
      .limit(1);

    if (!galleryRows.length) {
      return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
    }

    const gallery = galleryRows[0];

    const existingOrder = await db
      .select({ id: proofOrders.id })
      .from(proofOrders)
      .where(eq(proofOrders.galleryId, gallery.id))
      .limit(1);

    if (existingOrder.length) {
      return NextResponse.json(
        { error: "This gallery's selection has already been submitted." },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => null);
    const selections = normalizeSelections(body);

    if (!selections || !selections.length) {
      return NextResponse.json(
        { error: "Missing or invalid photo selections." },
        { status: 400 },
      );
    }

    const galleryPhotoRows = await db
      .select({ id: proofPhotos.id })
      .from(proofPhotos)
      .where(eq(proofPhotos.galleryId, gallery.id));

    const galleryPhotoIds = new Set(galleryPhotoRows.map((p) => p.id));

    for (const selection of selections) {
      if (!galleryPhotoIds.has(selection.photoId)) {
        return NextResponse.json(
          { error: "One or more photos don't belong to this gallery." },
          { status: 400 },
        );
      }
    }

    const selectedIds = selections
      .filter((s) => s.selected)
      .map((s) => s.photoId);

    const includedCount = Math.min(selectedIds.length, gallery.freePhotoCount);
    const extraCount = Math.max(0, selectedIds.length - gallery.freePhotoCount);
    const totalCents = extraCount * gallery.extraPhotoPriceCents;

    await db.transaction(async (tx) => {
      const now = new Date();

      for (const selection of selections) {
        await tx
          .update(proofPhotos)
          .set({
            selected: selection.selected,
            selectedAt: selection.selected ? now : null,
            comment: selection.comment,
          })
          .where(eq(proofPhotos.id, selection.photoId));
      }

      await tx.insert(proofOrders).values({
        galleryId: gallery.id,
        selectedPhotoIds: selectedIds,
        includedCount,
        extraCount,
        totalCents,
      });

      await tx
        .update(proofGalleries)
        .set({ status: "submitted" })
        .where(eq(proofGalleries.id, gallery.id));
    });

    return NextResponse.json({
      success: true,
      order: { includedCount, extraCount, totalCents },
    });
  } catch (error) {
    console.error("POST /api/proof/[token]/submit failed:", error);
    return NextResponse.json(
      { error: "Failed to submit selection." },
      { status: 500 },
    );
  }
}
