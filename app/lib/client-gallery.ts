import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { galleryClients } from "@/app/db/schema";
import { getClientView } from "@/app/lib/gallery-lifecycle";
import { loadGalleryLifecycle } from "@/app/lib/load-gallery-lifecycle";

// The one lookup behind a client's gallery link — used by the client page
// and every /api/proof/[token]/* route, so the client-facing access policy
// lives here and in the lifecycle module. Returns null for unknown tokens.
export async function loadClientGallery(token: string) {
  const lifecycle = await loadGalleryLifecycle({ token });

  if (!lifecycle) return null;

  const { gallery, order } = lifecycle;

  const ownerRows = await db
    .select({ id: galleryClients.id })
    .from(galleryClients)
    .where(
      and(
        eq(galleryClients.galleryId, gallery.id),
        eq(galleryClients.role, "owner"),
      ),
    )
    .limit(1);

  const view = getClientView(
    {
      skipProof: gallery.skipProof,
      finalsPublishedAt: gallery.finalsPublishedAt,
      order,
    },
    { required: gallery.requiresRegistration, claimed: ownerRows.length > 0 },
  );

  return {
    ...lifecycle,
    view,
    // Downloads follow what the page shows: none behind the registration
    // gate, the same as before finals are published.
    canDownload: view === "finals",
  };
}

// Same response for an unknown token on every client API route, and for
// requests the gallery's stage doesn't allow yet (e.g. downloads before
// finals are published) so they don't reveal more than an unknown token.
export function clientGalleryNotFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
