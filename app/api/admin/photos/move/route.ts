import { NextResponse } from "next/server";
import { withAdmin } from "@/app/lib/with-admin";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { revalidatePortfolio } from "@/app/lib/portfolio-cache";
import { db } from "@/app/db";
import { photos } from "@/app/db/schema";

export const POST = withAdmin(async (req: Request) => {
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

        revalidatePortfolio();
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
});