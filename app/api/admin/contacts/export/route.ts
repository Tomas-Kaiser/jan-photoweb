import { NextResponse } from "next/server";
import { withAdmin } from "@/app/lib/with-admin";
import { buildContactsCsv } from "@/app/lib/admin-contacts";
import { loadContacts } from "@/app/lib/load-contacts";

// Consenting contacts as CSV, for import into the external newsletter tool.
export const GET = withAdmin(async () => {
  try {
    const csv = buildContactsCsv(await loadContacts());
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contacts-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/contacts/export failed:", error);
    return NextResponse.json(
      { error: "Failed to export contacts." },
      { status: 500 },
    );
  }
});
