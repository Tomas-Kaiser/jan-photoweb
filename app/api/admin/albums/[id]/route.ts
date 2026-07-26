import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums } from "@/app/db/schema";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

type RequestBody = {
    name?: string;
    slug?: string;
};

function normalize(value: unknown) {
    if (typeof value !== "string") return "";
    return value.trim();
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}

async function requireAdmin() {
    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    return isAdmin;
}

async function deleteCloudflareImage(imageId: string) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

    if (!accountId || !apiToken) {
        return {
            ok: false as const,
            missing: false as const,
            status: 500,
            data: { error: "Missing Cloudflare configuration" },
        };
    }

    const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${encodeURIComponent(imageId)}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${apiToken}`,
            },
        }
    );

    const data = await res.json().catch(() => null);

    if (res.status === 404) {
        return {
            ok: true as const,
            missing: true as const,
            status: res.status,
            data,
        };
    }

    if (!res.ok || data?.success === false) {
        return {
            ok: false as const,
            missing: false as const,
            status: res.status,
            data,
        };
    }

    return {
        ok: true as const,
        missing: false as const,
        status: res.status,
        data,
    };
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const isAdmin = await requireAdmin();

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = (await req.json()) as RequestBody;

        const name = normalize(body.name);
        const inputSlug = normalize(body.slug);
        const slug = slugify(inputSlug || name);

        if (!name) {
            return NextResponse.json(
                { error: "Album name is required" },
                { status: 400 }
            );
        }

        if (!slug) {
            return NextResponse.json(
                { error: "Slug is required" },
                { status: 400 }
            );
        }

        const existingRows = await db
            .select({
                id: albums.id,
                name: albums.name,
                slug: albums.slug,
                path: albums.path,
                parentId: albums.parentId,
            })
            .from(albums)
            .where(eq(albums.id, id))
            .limit(1);

        if (!existingRows.length) {
            return NextResponse.json({ error: "Album not found" }, { status: 404 });
        }

        const currentAlbum = existingRows[0];

        let parentPath: string | null = null;

        if (currentAlbum.parentId) {
            const parentRows = await db
                .select({
                    path: albums.path,
                })
                .from(albums)
                .where(eq(albums.id, currentAlbum.parentId))
                .limit(1);

            if (!parentRows.length) {
                return NextResponse.json(
                    { error: "Parent album not found" },
                    { status: 400 }
                );
            }

            parentPath = parentRows[0].path;
        }

        const newPath = parentPath ? `${parentPath}/${slug}` : slug;
        const oldPath = currentAlbum.path;

        const conflictingAlbum = await db
            .select({ id: albums.id })
            .from(albums)
            .where(
                and(
                    ne(albums.id, id),
                    eq(albums.path, newPath),
                    currentAlbum.parentId
                        ? eq(albums.parentId, currentAlbum.parentId)
                        : sql`${albums.parentId} is null`
                )
            )
            .limit(1);

        if (conflictingAlbum.length) {
            return NextResponse.json(
                { error: "Another album with this slug already exists here." },
                { status: 409 }
            );
        }

        await db.transaction(async (tx) => {
            await tx
                .update(albums)
                .set({
                    name,
                    slug,
                    path: newPath,
                })
                .where(eq(albums.id, id));

            await tx
                .update(albums)
                .set({
                    path: sql`replace(${albums.path}, ${oldPath + "/"}, ${newPath + "/"})`,
                })
                .where(
                    and(
                        ne(albums.id, id),
                        sql`${albums.path} like ${oldPath + "/%"}`
                    )
                );
        });

        revalidatePath("/albums");
        revalidatePath(`/albums/${oldPath}`);
        revalidatePath(`/albums/${newPath}`);

        return NextResponse.json(
            {
                success: true,
                path: newPath,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to update album:", error);
        return NextResponse.json(
            { error: "Failed to update album" },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        const isAdmin = await requireAdmin();

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const albumRows = await db
            .select({
                id: albums.id,
                path: albums.path,
                parentId: albums.parentId,
                coverCloudflareId: albums.coverCloudflareId,
            })
            .from(albums)
            .where(eq(albums.id, id))
            .limit(1);

        if (!albumRows.length) {
            return NextResponse.json({ error: "Album not found" }, { status: 404 });
        }

        const album = albumRows[0];

        const childRows = await db
            .select({ id: albums.id })
            .from(albums)
            .where(eq(albums.parentId, album.id))
            .limit(1);

        if (childRows.length) {
            return NextResponse.json(
                { error: "Cannot delete an album that still has subalbums." },
                { status: 409 }
            );
        }

        const imageIdsToDelete = Array.from(
            new Set([album.coverCloudflareId].filter(Boolean))
        ) as string[];

        for (const imageId of imageIdsToDelete) {
            const result = await deleteCloudflareImage(imageId);

            if (result.missing) {
                console.warn("Cloudflare image already missing, continuing delete:", {
                    imageId,
                    status: result.status,
                    body: result.data,
                });
                continue;
            }

            if (!result.ok) {
                console.error("Cloudflare delete failed:", {
                    imageId,
                    status: result.status,
                    body: result.data,
                });

                return NextResponse.json(
                    { error: `Failed to delete Cloudflare image ${imageId}.` },
                    { status: 502 }
                );
            }
        }

        await db.transaction(async (tx) => {
            await tx.delete(albums).where(eq(albums.id, album.id));
        });

        revalidatePath("/albums");
        revalidatePath(`/albums/${album.path}`);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete album:", error);

        return NextResponse.json(
            { error: "Failed to delete album" },
            { status: 500 }
        );
    }
}