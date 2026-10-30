import { NextResponse } from "next/server";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { generateProofToken } from "@/app/lib/proof-token";
import { parseGalleryEventType } from "@/app/lib/gallery-event-type";

export const POST = withAdmin(async (req: Request) => {
  try {
    const body = await req.json();

    const clientName = String(body?.clientName || "").trim();
    const baseCostCents = Number(body?.baseCostCents ?? 0);
    const freePhotoCount = Number(body?.freePhotoCount);
    const extraPhotoPriceCents = Number(body?.extraPhotoPriceCents);
    const skipProof = body?.skipProof === true;
    const eventType = parseGalleryEventType(body?.eventType);

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 },
      );
    }

    if (!eventType.ok) {
      return NextResponse.json(
        { error: "Invalid event type." },
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

    const [inserted] = await db
      .insert(proofGalleries)
      .values({
        token: generateProofToken(clientName),
        clientName,
        baseCostCents,
        freePhotoCount,
        extraPhotoPriceCents,
        skipProof,
        eventType: eventType.eventType,
      })
      .returning({ id: proofGalleries.id });

    return NextResponse.json(
      { success: true, gallery: { id: inserted.id } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/proof-galleries failed:", error);

    return NextResponse.json(
      { error: "Failed to create proof gallery." },
      { status: 500 },
    );
  }
});
