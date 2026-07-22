import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/app/db";
import { photos } from "@/app/db/schema";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const sourceAlbumId = String(body.sourceAlbumId || "");
        const destinationAlbumId = String(body.destinationAlbumId || "");
        const photoIds = Array.isArray(body.photoIds) ? body.photoIds : [];
        const revalidatePaths = Array.isArray(body.revalidatePaths)
            ? body.revalidatePaths
            : [];

        if (!sourceAlbumId || !destinationAlbumId || photoIds.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        await db
            .update(photos)
            .set({ albumId: destinationAlbumId })
            .where(
                and(
                    eq(photos.albumId, sourceAlbumId),
                    inArray(photos.id, photoIds)
                )
            );

        for (const path of revalidatePaths) {
            revalidatePath(path);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to move photos." },
            { status: 500 }
        );
    }
}