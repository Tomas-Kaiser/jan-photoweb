import { NextResponse } from "next/server";
import { withAdmin } from "@/app/lib/with-admin";
import { requestCloudflareDirectUpload } from "@/app/lib/cloudflare-images";

export const POST = withAdmin(async () => {
    try {
        return NextResponse.json(await requestCloudflareDirectUpload());
    } catch (error) {
        console.error("Failed to create upload URL:", error);
        return NextResponse.json(
            { error: "Failed to create upload URL" },
            { status: 500 }
        );
    }
});
