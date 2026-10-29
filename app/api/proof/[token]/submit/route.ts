import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/app/db";
import { proofOrders, proofPhotos } from "@/app/db/schema";
import { routing } from "@/app/i18n/routing";
import { getAdminProofGalleryUrl } from "@/app/lib/admin-link";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import {
  clientGalleryNotFound,
  loadClientGallery,
} from "@/app/lib/client-gallery";

type Params = {
  params: Promise<{ token: string }>;
};

type PhotoRating = "rather_no" | "rather_yes" | null;

type PhotoSelection = {
  photoId: string;
  selected: boolean;
  comment: string | null;
  rating: PhotoRating;
};

const MAX_COMMENT_LENGTH = 500;
const VALID_RATINGS = new Set(["rather_no", "rather_yes"]);
const ALREADY_SUBMITTED = "This gallery's selection has already been submitted.";

function normalizeLocale(body: unknown): "en" | "cs" {
  const rawLocale = (body as { locale?: unknown } | null)?.locale;
  return rawLocale === "cs" ? "cs" : "en";
}

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
    const rawRating = (entry as { rating?: unknown }).rating;
    // A photo marked selected takes precedence over any rather-yes/no tag.
    const rating: PhotoRating =
      !selected && typeof rawRating === "string" && VALID_RATINGS.has(rawRating)
        ? (rawRating as PhotoRating)
        : null;

    if (!photoId) return null;

    selections.push({ photoId, selected, comment, rating });
  }

  return selections;
}

async function notifyAdminOfSubmission(options: {
  req: Request;
  locale: "en" | "cs";
  galleryId: string;
  clientName: string;
  includedCount: number;
  extraCount: number;
  totalCents: number;
  currency: string;
}) {
  const {
    req,
    locale,
    galleryId,
    clientName,
    includedCount,
    extraCount,
    totalCents,
    currency,
  } = options;

  // There's no stored admin locale, so the link uses the site's default.
  const adminUrl = getAdminProofGalleryUrl(
    process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin,
    routing.defaultLocale,
    galleryId,
  );

  const total = includedCount + extraCount;
  const totalLabel = formatMoneyFromCents(totalCents, currency);

  const subject =
    locale === "cs"
      ? `Nový výběr fotek od ${clientName}`
      : `${clientName} submitted their photo selection`;

  const text =
    locale === "cs"
      ? [
          `Výběr fotek byl odeslán od: ${clientName}`,
          "",
          `Vybráno: ${total} (${includedCount} v ceně balíčku, ${extraCount} navíc)`,
          `Celkem k úhradě: ${totalLabel}`,
          "",
          `Zobrazit v administraci: ${adminUrl}`,
        ].join("\n")
      : [
          `${clientName} just submitted their photo selection.`,
          "",
          `Selected: ${total} (${includedCount} included, ${extraCount} extra)`,
          `Total due: ${totalLabel}`,
          "",
          `View in admin: ${adminUrl}`,
        ].join("\n");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.CONTACT_TO || process.env.GMAIL_USER,
    subject,
    text,
  });
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;

    const clientGallery = await loadClientGallery(token);

    if (!clientGallery) {
      return clientGalleryNotFound();
    }

    const { gallery } = clientGallery;

    if (!clientGallery.permissions.canClientSubmit) {
      return NextResponse.json(
        {
          error: gallery.skipProof
            ? "This gallery has no proof selection."
            : ALREADY_SUBMITTED,
        },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => null);
    const selections = normalizeSelections(body);
    const locale = normalizeLocale(body);

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
    const totalCents =
      gallery.baseCostCents + extraCount * gallery.extraPhotoPriceCents;

    const submitted = await db.transaction(async (tx) => {
      // Insert the order first: a concurrent submit (e.g. a double-click)
      // waits on the unique index here, then inserts nothing and bails out
      // before touching the photos.
      const [order] = await tx
        .insert(proofOrders)
        .values({
          galleryId: gallery.id,
          selectedPhotoIds: selectedIds,
          includedCount,
          extraCount,
          totalCents,
        })
        .onConflictDoNothing({ target: proofOrders.galleryId })
        .returning({ id: proofOrders.id });

      if (!order) return false;

      const now = new Date();

      for (const selection of selections) {
        await tx
          .update(proofPhotos)
          .set({
            selected: selection.selected,
            selectedAt: selection.selected ? now : null,
            rating: selection.rating,
            comment: selection.comment,
          })
          .where(eq(proofPhotos.id, selection.photoId));
      }

      return true;
    });

    if (!submitted) {
      return NextResponse.json({ error: ALREADY_SUBMITTED }, { status: 409 });
    }

    try {
      await notifyAdminOfSubmission({
        req,
        locale,
        galleryId: gallery.id,
        clientName: gallery.clientName,
        includedCount,
        extraCount,
        totalCents,
        currency: gallery.currency,
      });
    } catch (error) {
      // The selection is already saved — don't fail the client's submission
      // over a notification email that didn't go out.
      console.error("Failed to send submission notification email:", error);
    }

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
