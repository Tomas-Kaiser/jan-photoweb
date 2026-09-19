import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { generateProofToken } from "@/app/lib/proof-token";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const isAdmin =
      !!session?.user && (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const clientName = String(body?.clientName || "").trim();
    const freePhotoCount = Number(body?.freePhotoCount);
    const extraPhotoPriceCents = Number(body?.extraPhotoPriceCents);

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required." },
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
        token: generateProofToken(),
        clientName,
        freePhotoCount,
        extraPhotoPriceCents,
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
}
