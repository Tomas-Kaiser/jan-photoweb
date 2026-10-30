import { NextResponse } from "next/server";
import {
  clientGalleryNotFound,
  loadClientGallery,
} from "@/app/lib/client-gallery";
import { completeOwnerRegistration } from "@/app/lib/owner-registration";

type Params = {
  params: Promise<{ token: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// No admin session here — the proof token is the credential. Verifies the
// emailed code or magic link and, on success, makes the person the
// gallery's owner. "alreadyClaimed" is a success for the caller too: the
// gallery is open to everyone either way.
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;

  const clientGallery = await loadClientGallery(token);

  if (!clientGallery) {
    return clientGalleryNotFound();
  }

  const body = await req.json().catch(() => null);
  const verificationId =
    typeof body?.verificationId === "string" ? body.verificationId : "";

  if (!UUID_PATTERN.test(verificationId)) {
    return clientGalleryNotFound();
  }

  const proof =
    typeof body?.linkToken === "string"
      ? { linkToken: body.linkToken }
      : { code: typeof body?.code === "string" ? body.code : "" };

  try {
    const result = await completeOwnerRegistration({
      galleryId: clientGallery.gallery.id,
      verificationId,
      proof,
    });

    if ("kind" in result) {
      if (result.kind === "notFound") return clientGalleryNotFound();
      return NextResponse.json({ status: result.kind });
    }

    if (result.reason === "wrong") {
      return NextResponse.json(
        { error: "wrong", attemptsLeft: result.attemptsLeft },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: result.reason }, { status: 410 });
  } catch (error) {
    console.error("POST /api/proof/[token]/registration/verify failed:", error);
    return NextResponse.json({ error: "verifyFailed" }, { status: 500 });
  }
}
