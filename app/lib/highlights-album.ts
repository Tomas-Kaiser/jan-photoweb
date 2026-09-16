import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { albums } from "@/app/db/schema";

// A reserved, unguessable-by-slugify album path used to hold photos that
// exist only to be shown in the homepage highlights carousel. It's excluded
// from every public/admin album listing (see queries filtering on this
// constant) so it's never visible as a real album — photos still need some
// albumId to satisfy the schema, but this container is otherwise invisible.
//
// Contains an underscore so it can never collide with a user-generated
// slug: slugify() only ever outputs lowercase letters, digits, and hyphens.
export const HIGHLIGHTS_ALBUM_PATH = "__portfolio_highlights__";

export async function getOrCreateHighlightsAlbumId(
  coverCloudflareId: string,
): Promise<string> {
  const existing = await db
    .select({ id: albums.id })
    .from(albums)
    .where(eq(albums.path, HIGHLIGHTS_ALBUM_PATH))
    .limit(1);

  if (existing.length) {
    return existing[0].id;
  }

  try {
    const [created] = await db
      .insert(albums)
      .values({
        name: "Portfolio Highlights",
        slug: HIGHLIGHTS_ALBUM_PATH,
        path: HIGHLIGHTS_ALBUM_PATH,
        parentId: null,
        coverCloudflareId,
      })
      .returning({ id: albums.id });

    return created.id;
  } catch {
    // Lost a race with a concurrent first-upload — the album now exists,
    // so just look it up instead of failing.
    const retried = await db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.path, HIGHLIGHTS_ALBUM_PATH))
      .limit(1);

    if (retried.length) {
      return retried[0].id;
    }

    throw new Error("Failed to create or find the highlights album.");
  }
}
