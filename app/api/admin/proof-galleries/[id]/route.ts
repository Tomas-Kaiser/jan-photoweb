import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";
import { deleteGalleryById } from "@/app/lib/delete-gallery-by-id";
import {
  AssetDeletionError,
  type AssetKind,
} from "@/app/lib/gallery-teardown";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

const ASSET_DELETION_ERRORS: Record<AssetKind, string> = {
  hero: "Failed to delete one or more hero photos from Cloudflare.",
  proof: "Failed to delete one or more photos from Cloudflare.",
  "final original": "Failed to delete one or more final photos.",
  "final preview": "Failed to delete one or more final photos.",
};

type Params = {
  params: Promise<{ id: string }>;
};

export const PATCH = withAdmin(async (req: Request, { params }: Params) => {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Partial<typeof proofGalleries.$inferInsert> = {};

    if ("message" in body) {
      const message =
        typeof body.message === "string" ? body.message.trim() : "";
      updates.message = message || null;
    }

    if ("finalsMessage" in body) {
      const finalsMessage =
        typeof body.finalsMessage === "string" ? body.finalsMessage.trim() : "";
      updates.finalsMessage = finalsMessage || null;
    }

    if ("eventDate" in body) {
      const raw =
        typeof body.eventDate === "string" ? body.eventDate.trim() : "";
      if (!raw) {
        updates.eventDate = null;
      } else {
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: "Invalid event date." },
            { status: 400 },
          );
        }
        updates.eventDate = parsed;
      }
    }

    if ("heroMobileCloudflareId" in body) {
      updates.heroMobileCloudflareId =
        typeof body.heroMobileCloudflareId === "string" &&
        body.heroMobileCloudflareId.trim()
          ? body.heroMobileCloudflareId.trim()
          : null;
    }

    if ("heroDesktopCloudflareId" in body) {
      updates.heroDesktopCloudflareId =
        typeof body.heroDesktopCloudflareId === "string" &&
        body.heroDesktopCloudflareId.trim()
          ? body.heroDesktopCloudflareId.trim()
          : null;
    }

    if ("clientName" in body) {
      const clientName = String(body?.clientName || "").trim();

      if (!clientName) {
        return NextResponse.json(
          { error: "Client name is required." },
          { status: 400 },
        );
      }

      updates.clientName = clientName;
    }

    const hasPricingFields =
      "baseCostCents" in body ||
      "freePhotoCount" in body ||
      "extraPhotoPriceCents" in body;

    if (hasPricingFields) {
      const lifecycle = await loadGalleryLifecycle({ id });

      if (!lifecycle) {
        return NextResponse.json(
          { error: "Proof gallery not found." },
          { status: 404 },
        );
      }

      // The order's total was computed from these prices when the client
      // submitted — changing them afterwards would desync the two.
      if (!lifecycle.permissions.canEditPricing) {
        return NextResponse.json(
          { error: "Pricing can't be changed after the client has submitted." },
          { status: 409 },
        );
      }

      const baseCostCents = Number(body?.baseCostCents ?? 0);
      const freePhotoCount = Number(body?.freePhotoCount);
      const extraPhotoPriceCents = Number(body?.extraPhotoPriceCents);

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

    // Replacing (or clearing) a hero photo orphans its old Cloudflare
    // Images asset unless we clean it up — fetch the previous id(s) first
    // so we know what to delete once the update succeeds.
    const touchesHeroMobile = "heroMobileCloudflareId" in updates;
    const touchesHeroDesktop = "heroDesktopCloudflareId" in updates;
    let previousHero: {
      heroMobileCloudflareId: string | null;
      heroDesktopCloudflareId: string | null;
    } | null = null;

    if (touchesHeroMobile || touchesHeroDesktop) {
      const rows = await db
        .select({
          heroMobileCloudflareId: proofGalleries.heroMobileCloudflareId,
          heroDesktopCloudflareId: proofGalleries.heroDesktopCloudflareId,
        })
        .from(proofGalleries)
        .where(eq(proofGalleries.id, id))
        .limit(1);
      previousHero = rows[0] ?? null;
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

    if (previousHero) {
      const toDelete = [
        touchesHeroMobile &&
        previousHero.heroMobileCloudflareId &&
        previousHero.heroMobileCloudflareId !== updates.heroMobileCloudflareId
          ? previousHero.heroMobileCloudflareId
          : null,
        touchesHeroDesktop &&
        previousHero.heroDesktopCloudflareId &&
        previousHero.heroDesktopCloudflareId !== updates.heroDesktopCloudflareId
          ? previousHero.heroDesktopCloudflareId
          : null,
      ].filter((cloudflareId): cloudflareId is string => Boolean(cloudflareId));

      for (const cloudflareId of toDelete) {
        try {
          await deleteCloudflareImage(cloudflareId);
        } catch (error) {
          console.error("Failed to delete replaced hero photo:", {
            cloudflareId,
            error,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/proof-galleries/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update proof gallery." },
      { status: 500 },
    );
  }
});

export const DELETE = withAdmin(async (_req: Request, { params }: Params) => {
  try {
    const { id } = await params;

    if (!(await deleteGalleryById(id))) {
      return NextResponse.json(
        { error: "Proof gallery not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AssetDeletionError) {
      console.error("Failed to delete gallery assets:", error);
      return NextResponse.json(
        { error: ASSET_DELETION_ERRORS[error.kind] },
        { status: 502 },
      );
    }

    console.error("DELETE /api/admin/proof-galleries/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete proof gallery." },
      { status: 500 },
    );
  }
});
