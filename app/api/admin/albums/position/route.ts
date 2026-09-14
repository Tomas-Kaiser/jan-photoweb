import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const isAdmin =
            !!session?.user &&
            (session.user as { role?: string }).role === "admin";

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const albumId = String(body?.albumId || "").trim();
        const objectPosition = String(body?.objectPosition || "").trim();
        const revalidatePaths = Array.isArray(body?.revalidatePaths)
            ? body.revalidatePaths.filter(
                (value: unknown): value is string =>
                    typeof value === "string" && value.length > 0
            )
            : [];

        if (!albumId || !objectPosition) {
            return NextResponse.json(
                { error: "albumId and objectPosition are required." },
                { status: 400 }
            );
        }

        if (objectPosition.length > 50) {
            return NextResponse.json(
                { error: "objectPosition is too long." },
                { status: 400 }
            );
        }

        const existing = await db
            .select({ id: albums.id })
            .from(albums)
            .where(eq(albums.id, albumId))
            .limit(1);

        if (!existing.length) {
            return NextResponse.json({ error: "Album not found." }, { status: 404 });
        }

        await db
            .update(albums)
            .set({ objectPosition })
            .where(eq(albums.id, albumId));

        revalidatePath("/albums");
        for (const path of revalidatePaths) {
            revalidatePath(path);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("POST /api/admin/albums/position failed:", error);

        return NextResponse.json(
            { error: "Failed to update album position." },
            { status: 500 }
        );
    }
}
