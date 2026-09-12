import type { MetadataRoute } from "next";
import { asc } from "drizzle-orm";

import { routing } from "./i18n/routing";
import { db } from "./db";
import { albums } from "./db/schema";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"
).replace(/\/$/, "");

const staticPaths = ["", "/about", "/services", "/contact", "/albums"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allAlbums = await db
    .select({ path: albums.path })
    .from(albums)
    .orderBy(asc(albums.path));

  const paths = [
    ...staticPaths,
    ...allAlbums.map((album) => `/albums/${album.path}`),
  ];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])
        ),
      },
    }))
  );
}
