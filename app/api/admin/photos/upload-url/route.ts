import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
            },
        }
    );

    const data = await res.json();

    if (!res.ok || !data?.result) {
        return NextResponse.json(
            { error: "Failed to create upload URL" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        id: data.result.id,
        uploadURL: data.result.uploadURL,
    });
}