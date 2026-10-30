import { NextResponse } from "next/server";
import {
  clientGalleryNotFound,
  loadClientGallery,
} from "@/app/lib/client-gallery";
import {
  completeRegistration,
  isVerificationId,
} from "@/app/lib/client-registration";

type Params = {
  params: Promise<{ token: string }>;
};

// No admin session here — the proof token is the credential. Verifies the
// emailed code or magic link and, on success, makes the person the
// gallery's owner or links them as a guest, depending on the form the
// verification started from. "alreadyClaimed" is a success for the caller
// too: the gallery is open to everyone either way.
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;

  const clientGallery = await loadClientGallery(token);

  if (!clientGallery) {
    return clientGalleryNotFound();
  }

  const body = await req.json().catch(() => null);
  const verificationId = body?.verificationId;

  if (!isVerificationId(verificationId)) {
    return clientGalleryNotFound();
  }

  const proof =
    typeof body?.linkToken === "string"
      ? { linkToken: body.linkToken }
      : { code: typeof body?.code === "string" ? body.code : "" };

  try {
    const result = await completeRegistration({
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
