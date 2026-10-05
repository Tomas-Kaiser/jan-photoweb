import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { finalPhotos, proofGalleries, proofPhotos } from "@/app/db/schema";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";
import { deleteR2Object } from "@/app/lib/r2-client";

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
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const galleryRows = await db
      .select({
        id: proofGalleries.id,
        heroMobileCloudflareId: proofGalleries.heroMobileCloudflareId,
        heroDesktopCloudflareId: proofGalleries.heroDesktopCloudflareId,
      })
      .from(proofGalleries)
      .where(eq(proofGalleries.id, id))
      .limit(1);

    if (!galleryRows.length) {
      return NextResponse.json(
        { error: "Proof gallery not found." },
        { status: 404 },
      );
    }

    for (const cloudflareId of [
      galleryRows[0].heroMobileCloudflareId,
      galleryRows[0].heroDesktopCloudflareId,
    ]) {
      if (!cloudflareId) continue;
      try {
        await deleteCloudflareImage(cloudflareId);
      } catch (error) {
        console.error("Failed to delete hero photo from Cloudflare:", {
          cloudflareId,
          error,
        });
        return NextResponse.json(
          {
            error: "Failed to delete one or more hero photos from Cloudflare.",
          },
          { status: 502 },
        );
      }
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

    const galleryFinalPhotos = await db
      .select({
        r2Key: finalPhotos.r2Key,
        previewCloudflareId: finalPhotos.previewCloudflareId,
      })
      .from(finalPhotos)
      .where(eq(finalPhotos.galleryId, id));

    for (const photo of galleryFinalPhotos) {
      try {
        await deleteR2Object(photo.r2Key);
        await deleteCloudflareImage(photo.previewCloudflareId);
      } catch (error) {
        console.error("Failed to delete final photo assets:", {
          r2Key: photo.r2Key,
          error,
        });
        return NextResponse.json(
          { error: "Failed to delete one or more final photos." },
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
