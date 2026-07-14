import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { photos } from "@/app/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ReorderItem = {
    id: string;
    sortOrder: number;
};

type RequestBody = {
    albumId: string;
    items: ReorderItem[];
    revalidatePaths?: string[];
};

export async function POST(req: Request) {
    try {
        const session = await auth();
        const isAdmin =
            !!session?.user &&
            (session.user as { role?: string }).role === "admin";

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await req.json()) as RequestBody;

        const albumId = String(body?.albumId || "").trim();
        const items = Array.isArray(body?.items) ? body.items : [];
        const revalidatePaths = Array.isArray(body?.revalidatePaths)
            ? body.revalidatePaths.filter((value): value is string => typeof value === "string" && value.length > 0)
            : [];

        if (!albumId || items.length === 0) {
            return NextResponse.json(
                { error: "albumId and items are required." },
                { status: 400 }
            );
        }

        const ids = items.map((item) => String(item.id || "").trim()).filter(Boolean);

        if (ids.length !== items.length) {
            return NextResponse.json(
                { error: "Every item must have an id." },
                { status: 400 }
            );
        }

        const existing = await db
            .select({
                id: photos.id,
                albumId: photos.albumId,
            })
            .from(photos)
            .where(and(eq(photos.albumId, albumId), inArray(photos.id, ids)))
            .orderBy(asc(photos.sortOrder), asc(photos.createdAt));

        if (existing.length !== ids.length) {
            return NextResponse.json(
                { error: "Some photos were not found in this album." },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            for (let index = 0; index < items.length; index += 1) {
                const item = items[index];
                await tx
                    .update(photos)
                    .set({ sortOrder: index })
                    .where(and(eq(photos.id, item.id), eq(photos.albumId, albumId)));
            }
        });

        revalidatePath("/albums");
        for (const path of revalidatePaths) {
            revalidatePath(path);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("POST /api/admin/photos/reorder failed:", error);

        return NextResponse.json(
            { error: "Failed to reorder photos." },
            { status: 500 }
        );
    }
}