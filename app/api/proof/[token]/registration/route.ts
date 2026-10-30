import { NextResponse } from "next/server";
import {
  clientGalleryNotFound,
  loadClientGallery,
} from "@/app/lib/client-gallery";
import { normaliseEmail } from "@/app/lib/email-verification";
import { startOwnerRegistration } from "@/app/lib/owner-registration";

type Params = {
  params: Promise<{ token: string }>;
};

const MAX_NAME_LENGTH = 200;

// No admin session here — the proof token is the credential. Starts (or,
// with `resend`, re-sends) the owner verification email for a gallery
// showing the registration screen.
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;

  const clientGallery = await loadClientGallery(token);

  if (clientGallery?.view !== "registration") {
    return clientGalleryNotFound();
  }

  const body = await req.json().catch(() => null);
  const name =
    typeof body?.name === "string"
      ? body.name.trim().slice(0, MAX_NAME_LENGTH)
      : "";
  const email = normaliseEmail(body?.email);

  if (!name) {
    return NextResponse.json({ error: "invalidName" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
  }

  try {
    const result = await startOwnerRegistration({
      gallery: clientGallery.gallery,
      name,
      email,
      locale: body?.locale === "cs" ? "cs" : "en",
      marketingConsent: body?.marketingConsent === true,
      resend: body?.resend === true,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin,
    });

    if (result.kind === "rateLimited") {
      return NextResponse.json(
        { error: "rateLimited", retryAfterSeconds: result.retryAfterSeconds },
        { status: 429 },
      );
    }

    return NextResponse.json({
      verificationId: result.verificationId,
      sent: result.kind === "sent",
    });
  } catch (error) {
    console.error("POST /api/proof/[token]/registration failed:", error);
    return NextResponse.json({ error: "sendFailed" }, { status: 500 });
  }
}
