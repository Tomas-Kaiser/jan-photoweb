import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
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

        const body = await req.json();

        const name = String(body?.name || "").trim();
        const parentId = body?.parentId ? String(body.parentId) : null;
        const coverCloudflareId = String(body?.coverCloudflareId || "").trim();

        if (!name || !coverCloudflareId) {
            return NextResponse.json(
                { error: "Name and cover image are required." },
                { status: 400 }
            );
        }

        const slug = slugify(name);

        if (!slug) {
            return NextResponse.json(
                { error: "Invalid album name." },
                { status: 400 }
            );
        }

        let path = slug;

        if (parentId) {
            const parentRows = await db
                .select({
                    id: albums.id,
                    path: albums.path,
                })
                .from(albums)
                .where(eq(albums.id, parentId))
                .limit(1);

            if (!parentRows.length) {
                return NextResponse.json(
                    { error: "Parent album not found." },
                    { status: 404 }
                );
            }

            path = `${parentRows[0].path}/${slug}`;
        }

        const inserted = await db
            .insert(albums)
            .values({
                name,
                slug,
                parentId,
                path,
                coverCloudflareId,
            })
            .returning({
                id: albums.id,
                name: albums.name,
                slug: albums.slug,
                path: albums.path,
            });

        revalidatePath("/albums");
        revalidatePath("/admin/albums");

        return NextResponse.json(
            { success: true, album: inserted[0] },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("POST /api/admin/albums failed:", error);

        const code = error?.code ?? error?.cause?.code;
        const constraint = error?.constraint ?? error?.cause?.constraint;

        if (code === "23505" && constraint === "albums_path_unique") {
            return NextResponse.json(
                { error: "An album with this name already exists in this location." },
                { status: 409 }
            );
        }

        if (code === "23505") {
            return NextResponse.json(
                { error: "This album already exists." },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create album." },
            { status: 500 }
        );
    }
}