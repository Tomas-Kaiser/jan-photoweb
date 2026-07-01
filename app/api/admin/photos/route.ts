// app/api/admin/photos/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.albumId || !body.cloudflareUrl) {
        return NextResponse.json(
            { error: "Missing albumId or cloudflareUrl" },
            { status: 400 }
        );
    }

    const albumResult = await db
        .select({
            id: albums.id,
            path: albums.path,
        })
        .from(albums)
        .where(eq(albums.id, body.albumId))
        .limit(1);

    if (!albumResult.length) {
        return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const album = albumResult[0];

    await db.insert(photos).values({
        albumId: album.id,
        name: body.name ?? null,
        cloudflareUrl: body.cloudflareUrl,
        cloudflareId: body.cloudflareId ?? null,
        objectPosition: "center",
        sortOrder: -1,
    });

    revalidatePath(`/albums/${album.path}`);

    return NextResponse.json({ success: true });
}