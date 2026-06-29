// app/api/admin/photos/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { photos } from "@/app/db/schema";
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

    await db.insert(photos).values({
        albumSlug: body.albumSlug,
        name: body.name,
        cloudflareUrl: body.cloudflareUrl,
        objectPosition: "center",
        sortOrder: -1,
    });

    revalidatePath(`/albums/${body.albumSlug}`);
    return NextResponse.json({ success: true });
}