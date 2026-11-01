import { getCloudflareImageUrl } from "./cloudflare-images";
import { getRootAlbums } from "./portfolio-cache";

export type FeaturedHomepageAlbum = {
  id: string;
  name: string;
  href: string;
  imgSrc: string;
  objectPosition: string;
};

// Homepage-only prominence order: weddings and couples are the most
// visited albums, so they lead the homepage's featured grid regardless of
// their sortOrder on the /albums page (which controls admin/browse
// ordering, not homepage prominence). Anything else fills remaining slots
// in its existing sortOrder.
const HOMEPAGE_ALBUM_PRIORITY = ["weddings", "couples"];

/**
 * Root albums to feature on the homepage, ordered by `HOMEPAGE_ALBUM_PRIORITY`
 * first and then by each album's own sortOrder, capped at `limit`.
 */
export async function getFeaturedHomepageAlbums(
  locale: string,
  limit = 2,
): Promise<FeaturedHomepageAlbum[]> {
  const rootAlbumRows = await getRootAlbums();

  const prioritized = HOMEPAGE_ALBUM_PRIORITY.map((path) =>
    rootAlbumRows.find((album) => album.path === path),
  ).filter((album): album is (typeof rootAlbumRows)[number] => !!album);
  const rest = rootAlbumRows.filter(
    (album) => !HOMEPAGE_ALBUM_PRIORITY.includes(album.path),
  );

  return [...prioritized, ...rest].slice(0, limit).map((album) => ({
    id: album.id,
    name: album.name,
    href: `/${locale}/albums/${album.path}`,
    imgSrc: getCloudflareImageUrl(album.coverCloudflareId, "detail"),
    objectPosition: album.objectPosition ?? "center",
  }));
}
