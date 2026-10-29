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

    if (!permissions.canReopen || !order) {
      return NextResponse.json(
        {
          error: order
            ? "A paid selection can't be reopened."
            : "The client hasn't submitted a selection yet.",
        },
        { status: 409 },
      );
    }

    // The previous per-photo choices and comments stay on proof_photos, so
    // the client sees their earlier selection pre-filled when it reopens.
    await db.delete(proofOrders).where(eq(proofOrders.id, order.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/proof-galleries/[id]/reopen failed:", error);
    return NextResponse.json(
      { error: "Failed to reopen the selection." },
      { status: 500 },
    );
  }
});
