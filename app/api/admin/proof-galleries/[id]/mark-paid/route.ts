import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { proofOrders } from "@/app/db/schema";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withAdmin(async (_req: Request, { params }: Params) => {
  try {
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

    await db
      .update(proofOrders)
      .set({ status: "paid", confirmedAt: new Date() })
      .where(eq(proofOrders.id, orderRows[0].id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/proof-galleries/[id]/mark-paid failed:", error);
    return NextResponse.json(
      { error: "Failed to mark as paid." },
      { status: 500 },
    );
  }
});
