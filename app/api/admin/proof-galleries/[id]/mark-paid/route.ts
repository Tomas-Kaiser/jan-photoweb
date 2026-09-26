import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries, proofOrders } from "@/app/db/schema";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    const isAdmin =
      !!session?.user && (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const orderRows = await db
      .select({ id: proofOrders.id, status: proofOrders.status })
      .from(proofOrders)
      .where(eq(proofOrders.galleryId, id))
      .limit(1);

    if (!orderRows.length) {
      return NextResponse.json(
        { error: "The client hasn't submitted a selection yet." },
        { status: 409 },
      );
    }

    if (orderRows[0].status === "paid") {
      return NextResponse.json({ success: true });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(proofOrders)
        .set({ status: "paid", confirmedAt: new Date() })
        .where(eq(proofOrders.id, orderRows[0].id));

      await tx
        .update(proofGalleries)
        .set({ status: "paid" })
        .where(eq(proofGalleries.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/proof-galleries/[id]/mark-paid failed:", error);
    return NextResponse.json(
      { error: "Failed to mark as paid." },
      { status: 500 },
    );
  }
}
