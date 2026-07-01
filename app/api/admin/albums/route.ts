import { NextResponse } from "next/server";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums } from "@/app/db/schema";

type RequestBody = {
    name?: string;
    slug?: string;
    parentId?: string | null;
    coverUrl?: string | null;
    objectPosition?: string | null;
};

function normalize(value: unknown) {
    if (typeof value !== "string") return "";
    return value.trim();
}

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/--+/g, "-");
}

export async function GET() {
    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const albumList = await db
        .select({
            id: albums.id,
            name: albums.name,
            path: albums.path,
            parentId: albums.parentId,
            sortOrder: albums.sortOrder,
        })
        .from(albums)
        .orderBy(asc(albums.path));

    return NextResponse.json({ albums: albumList });
}

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

        const name = normalize(body.name);
        const incomingSlug = normalize(body.slug);
        const parentId = normalize(body.parentId ?? "") || null;
        const coverUrl = normalize(body.coverUrl ?? "");
        const objectPosition = normalize(body.objectPosition ?? "") || "center";

        if (!name) {
            return NextResponse.json({ error: "Album name is required" }, { status: 400 });
        }

        if (!coverUrl) {
            return NextResponse.json({ error: "Cover image is required" }, { status: 400 });
        }

        const slug = incomingSlug || slugify(name);

        if (!slug) {
            return NextResponse.json({ error: "Valid slug is required" }, { status: 400 });
        }

        let parentAlbum:
            | {
                id: string;
                path: string;
            }
            | null = null;

        if (parentId) {
            const parentResult = await db
                .select({
                    id: albums.id,
                    path: albums.path,
                })
                .from(albums)
                .where(eq(albums.id, parentId))
                .limit(1);

            if (!parentResult.length) {
                return NextResponse.json(
                    { error: "Selected parent album does not exist" },
                    { status: 400 }
                );
            }

            parentAlbum = parentResult[0];
        }

        const path = parentAlbum ? `${parentAlbum.path}/${slug}` : slug;

        const existingPath = await db
            .select({ id: albums.id })
            .from(albums)
            .where(eq(albums.path, path))
            .limit(1);

        if (existingPath.length > 0) {
            return NextResponse.json(
                { error: "An album with this path already exists" },
                { status: 409 }
            );
        }

        const siblingSlugConflict = await db
            .select({ id: albums.id })
            .from(albums)
            .where(
                parentAlbum
                    ? and(eq(albums.parentId, parentAlbum.id), eq(albums.slug, slug))
                    : and(isNull(albums.parentId), eq(albums.slug, slug))
            )
            .limit(1);

        if (siblingSlugConflict.length > 0) {
            return NextResponse.json(
                { error: "An album with this slug already exists in that location" },
                { status: 409 }
            );
        }

        const siblingMaxSortOrder = await db
            .select({
                maxSortOrder: sql<number>`coalesce(max(${albums.sortOrder}), -1)`,
            })
            .from(albums)
            .where(parentAlbum ? eq(albums.parentId, parentAlbum.id) : isNull(albums.parentId));

        const nextSortOrder = (siblingMaxSortOrder[0]?.maxSortOrder ?? -1) + 1;

        const inserted = await db
            .insert(albums)
            .values({
                name,
                slug,
                path,
                parentId: parentAlbum?.id ?? null,
                coverUrl,
                objectPosition,
                sortOrder: nextSortOrder,
            })
            .returning({
                id: albums.id,
                path: albums.path,
                parentId: albums.parentId,
            });

        const createdAlbum = inserted[0];

        revalidatePath("/albums");
        revalidatePath(`/albums/${createdAlbum.path}`);

        if (parentAlbum) {
            revalidatePath(`/albums/${parentAlbum.path}`);
        }

        return NextResponse.json(
            {
                success: true,
                album: createdAlbum,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to create album:", error);
        return NextResponse.json(
            { error: "Failed to create album" },
            { status: 500 }
        );
    }
}