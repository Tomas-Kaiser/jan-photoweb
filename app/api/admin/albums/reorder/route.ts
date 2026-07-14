import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums } from "@/app/db/schema";
import { asc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ReorderItem = {
    id: string;
    sortOrder: number;
};

type RequestBody = {
    parentId: string | null;
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

        const parentId =
            body?.parentId === null || body?.parentId === undefined || body?.parentId === ""
                ? null
                : String(body.parentId);

        const items = Array.isArray(body?.items) ? body.items : [];
        const revalidatePaths = Array.isArray(body?.revalidatePaths)
            ? body.revalidatePaths.filter((value): value is string => typeof value === "string" && value.length > 0)
            : [];

        if (items.length === 0) {
            return NextResponse.json(
                { error: "items are required." },
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
                id: albums.id,
                parentId: albums.parentId,
            })
            .from(albums)
            .where(parentId ? eq(albums.parentId, parentId) : isNull(albums.parentId))
            .orderBy(asc(albums.sortOrder), asc(albums.createdAt));

        const scopedIds = existing.map((row) => row.id);
        const allMatchScope =
            ids.length === scopedIds.filter((id) => ids.includes(id)).length &&
            ids.every((id) => scopedIds.includes(id));

        if (!allMatchScope) {
            return NextResponse.json(
                { error: "Some albums were not found in this scope." },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            for (let index = 0; index < items.length; index += 1) {
                const item = items[index];
                await tx
                    .update(albums)
                    .set({ sortOrder: index })
                    .where(eq(albums.id, item.id));
            }
        });

        revalidatePath("/albums");
        revalidatePath("/admin/albums");
        for (const path of revalidatePaths) {
            revalidatePath(path);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("POST /api/admin/albums/reorder failed:", error);

        return NextResponse.json(
            { error: "Failed to reorder albums." },
            { status: 500 }
        );
    }
}