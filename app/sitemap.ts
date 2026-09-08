import type { MetadataRoute } from "next";

import { routing } from "./i18n/routing";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"
).replace(/\/$/, "");

const staticPaths = ["", "/about", "/services", "/contact", "/albums"];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.flatMap((path) =>
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
