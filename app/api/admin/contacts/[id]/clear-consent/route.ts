import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { clients } from "@/app/db/schema";
import { NO_MARKETING_CONSENT } from "@/app/lib/marketing-consent";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withAdmin(async (_req: Request, { params }: Params) => {
  try {
    const { id } = await params;

    const updated = await db
      .update(clients)
      .set(NO_MARKETING_CONSENT)
      .where(eq(clients.id, id))
      .returning({ id: clients.id });

    if (!updated.length) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "POST /api/admin/contacts/[id]/clear-consent failed:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to clear consent." },
      { status: 500 },
    );
  }
});
