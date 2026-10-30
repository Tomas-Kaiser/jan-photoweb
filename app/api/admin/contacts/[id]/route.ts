import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/app/lib/with-admin";
import { db } from "@/app/db";
import { clients, emailVerifications } from "@/app/db/schema";

type Params = {
  params: Promise<{ id: string }>;
};

// GDPR erasure of a person: the client row (cascading their gallery links)
// and any verifications still holding their email and name. The galleries
// stay; one this person owned becomes unclaimed again.
export const DELETE = withAdmin(async (_req: Request, { params }: Params) => {
  try {
    const { id } = await params;

    const deleted = await db.transaction(async (tx) => {
      const rows = await tx
        .delete(clients)
        .where(eq(clients.id, id))
        .returning({ email: clients.email });

      if (rows.length) {
        await tx
          .delete(emailVerifications)
          .where(eq(emailVerifications.email, rows[0].email));
      }
      return rows.length > 0;
    });

    if (!deleted) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/contacts/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete the contact." },
      { status: 500 },
    );
  }
});
