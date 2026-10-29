import { NextResponse } from "next/server";
import { getClientView } from "@/app/lib/gallery-lifecycle";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

// The one lookup behind a client's gallery link — used by the client page
// and every /api/proof/[token]/* route, so the client-facing access policy
// lives here and in the lifecycle module. Returns null for unknown tokens.
export async function loadClientGallery(token: string) {
  const lifecycle = await loadGalleryLifecycle({ token });

  if (!lifecycle) return null;

  const { gallery, order } = lifecycle;

  return {
    ...lifecycle,
    view: getClientView({
      skipProof: gallery.skipProof,
      finalsPublishedAt: gallery.finalsPublishedAt,
      order,
    }),
  };
}

// Same response for an unknown token on every client API route, and for
// requests the gallery's stage doesn't allow yet (e.g. downloads before
// finals are published) so they don't reveal more than an unknown token.
export function clientGalleryNotFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
