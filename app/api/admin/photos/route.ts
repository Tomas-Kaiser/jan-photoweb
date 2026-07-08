import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
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
        const cloudflareId = String(body?.cloudflareId || "").trim();
        const name = String(body?.name || "").trim();

        if (!albumId || !cloudflareId) {
            return NextResponse.json(
                { error: "Missing albumId or cloudflareId" },
                { status: 400 }
            );
        }

        const albumResult = await db
            .select({
                id: albums.id,
                path: albums.path,
            })
            .from(albums)
            .where(eq(albums.id, albumId))
            .limit(1);

        if (!albumResult.length) {
            return NextResponse.json({ error: "Album not found" }, { status: 404 });
        }

        const album = albumResult[0];

        await db.insert(photos).values({
            albumId: album.id,
            name: name || null,
            cloudflareId,
            objectPosition: "center",
            sortOrder: -1,
        });

        revalidatePath(`/albums/${album.path}`);
        revalidatePath("/admin/albums");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to create photo:", error);

        return NextResponse.json(
            { error: "Failed to create photo" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        const isAdmin =
            !!session?.user &&
            (session.user as { role?: string }).role === "admin";

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (!body.photoId) {
            return NextResponse.json(
                { error: "Missing photoId" },
                { status: 400 }
            );
        }

        const photoResult = await db
            .select({
                id: photos.id,
                albumId: photos.albumId,
                cloudflareId: photos.cloudflareId,
            })
            .from(photos)
            .where(eq(photos.id, body.photoId))
            .limit(1);

        if (!photoResult.length) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        const photo = photoResult[0];

        const albumResult = await db
            .select({
                id: albums.id,
                path: albums.path,
            })
            .from(albums)
            .where(eq(albums.id, photo.albumId))
            .limit(1);

        if (!albumResult.length) {
            return NextResponse.json({ error: "Album not found" }, { status: 404 });
        }

        const album = albumResult[0];

        if (photo.cloudflareId) {
            const cfRes = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${encodeURIComponent(photo.cloudflareId)}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
                    },
                }
            );

            if (!cfRes.ok) {
                const cfText = await cfRes.text();
                console.error("Cloudflare delete failed:", cfText);

                return NextResponse.json(
                    { error: "Failed to delete image from Cloudflare" },
                    { status: 502 }
                );
            }
        }

        await db.delete(photos).where(eq(photos.id, body.photoId));

        revalidatePath(`/albums/${album.path}`);
        revalidatePath("/admin/albums");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete photo:", error);
        return NextResponse.json(
            { error: "Failed to delete photo" },
            { status: 500 }
        );
    }
}