import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { proofOrders } from "@/app/db/schema";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withAdmin(async (_req: Request, { params }: Params) => {
  try {
    const { id } = await params;

    const lifecycle = await loadGalleryLifecycle({ id });

    if (!lifecycle) {
      return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
    }

    const { order, permissions } = lifecycle;

    if (!permissions.canMarkPaid || !order) {
      // Already paid — a repeated click is a no-op, not an error.
      if (order?.status === "paid") {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: "The client hasn't submitted a selection yet." },
        { status: 409 },
      );
    }

    await db
      .update(proofOrders)
      .set({ status: "paid", confirmedAt: new Date() })
      .where(eq(proofOrders.id, order.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/proof-galleries/[id]/mark-paid failed:", error);
    return NextResponse.json(
      { error: "Failed to mark as paid." },
      { status: 500 },
    );
  }
});
