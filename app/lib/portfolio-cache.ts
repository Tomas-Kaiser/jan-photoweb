import { revalidateTag, unstable_cache } from "next/cache";
import { and, asc, eq, exists, isNull, ne, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/app/db";
import { albums, photos, portfolioHighlights } from "@/app/db/schema";
import { HIGHLIGHTS_ALBUM_PATH } from "@/app/lib/highlights-album";

// Cached reads behind the public portfolio pages, which otherwise query the
// database on every visit, crawlers included, and so keep a scale-to-zero
// Neon compute awake. The data only changes through the admin, so one tag
// covers it all: a single album or photo write can reach several of these
// reads (cascades, renamed child paths, highlights), and writes are rare.
//
// Entries are stored as JSON, so these reads must not select Date columns:
// they would come back as strings on a cache hit.

const PORTFOLIO_TAG = "portfolio";

const cacheOptions = {
  tags: [PORTFOLIO_TAG],
  // Only a backstop for changes made outside the admin, such as a seed.
  revalidate: 60 * 60 * 24,
};

// Call after every write to albums, photos or portfolioHighlights.
export function revalidatePortfolio() {
  revalidateTag(PORTFOLIO_TAG);
}

export const getHighlights = unstable_cache(
  () =>
    db
      .select({
        highlightId: portfolioHighlights.id,
        cloudflareId: photos.cloudflareId,
        name: photos.name,
        photoObjectPosition: photos.objectPosition,
      })
      .from(portfolioHighlights)
      .innerJoin(photos, eq(portfolioHighlights.photoId, photos.id))
      .orderBy(asc(portfolioHighlights.sortOrder)),
  ["portfolio-highlights"],
  cacheOptions,
);

export const getRootAlbums = unstable_cache(
  () =>
    db
      .select({
        id: albums.id,
        name: albums.name,
        path: albums.path,
        coverCloudflareId: albums.coverCloudflareId,
        objectPosition: albums.objectPosition,
        sortOrder: albums.sortOrder,
      })
      .from(albums)
      .where(
        and(isNull(albums.parentId), ne(albums.path, HIGHLIGHTS_ALBUM_PATH)),
      )
      .orderBy(asc(albums.sortOrder), asc(albums.createdAt)),
  ["portfolio-root-albums"],
  cacheOptions,
);

export const getAlbumOptions = unstable_cache(
  () =>
    db
      .select({
        id: albums.id,
        name: albums.name,
        path: albums.path,
      })
      .from(albums)
      .where(ne(albums.path, HIGHLIGHTS_ALBUM_PATH))
      .orderBy(asc(albums.path)),
  ["portfolio-album-options"],
  cacheOptions,
);

// Albums photos can be moved into: those holding photos and no sub-albums.
export const getMovableLeafAlbums = unstable_cache(
  () => {
    const childAlbumsAlias = alias(albums, "child_albums");

    return db
      .select({
        id: albums.id,
        name: albums.name,
        path: albums.path,
      })
      .from(albums)
      .where(
        and(
          exists(
            db
              .select({ id: photos.id })
              .from(photos)
              .where(eq(photos.albumId, albums.id)),
          ),
          notExists(
            db
              .select({ id: childAlbumsAlias.id })
              .from(childAlbumsAlias)
              .where(eq(childAlbumsAlias.parentId, albums.id)),
          ),
          ne(albums.path, HIGHLIGHTS_ALBUM_PATH),
        ),
      )
      .orderBy(asc(albums.path));
  },
  ["portfolio-movable-leaf-albums"],
  cacheOptions,
);

// Null for an unknown path, so repeated requests for one are cached too.
export const getAlbumContent = unstable_cache(
  async (path: string) => {
    const [album] = await db
      .select({
        id: albums.id,
        name: albums.name,
        path: albums.path,
        coverCloudflareId: albums.coverCloudflareId,
        objectPosition: albums.objectPosition,
      })
      .from(albums)
      .where(eq(albums.path, path))
      .limit(1);

    if (!album) return null;

    const childAlbums = await db
      .select({
        id: albums.id,
        name: albums.name,
        path: albums.path,
        coverCloudflareId: albums.coverCloudflareId,
        objectPosition: albums.objectPosition,
        sortOrder: albums.sortOrder,
      })
      .from(albums)
      .where(eq(albums.parentId, album.id))
      .orderBy(asc(albums.sortOrder), asc(albums.createdAt));

    const albumPhotos = await db
      .select({
        id: photos.id,
        albumId: photos.albumId,
        name: photos.name,
        cloudflareId: photos.cloudflareId,
        objectPosition: photos.objectPosition,
        sortOrder: photos.sortOrder,
      })
      .from(photos)
      .where(
        and(
          eq(photos.albumId, album.id),
          ne(photos.visibility, "highlights_only"),
        ),
      )
      .orderBy(asc(photos.sortOrder), asc(photos.createdAt));

    return { album, childAlbums, photos: albumPhotos };
  },
  ["portfolio-album-content"],
  cacheOptions,
);
