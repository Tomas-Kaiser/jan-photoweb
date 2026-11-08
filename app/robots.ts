import type { MetadataRoute } from "next";

import { routing } from "./i18n/routing";
import { siteUrl } from "./lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Link-preview crawlers honour robots.txt when fetching a shared
      // gallery's watermarked preview image.
      allow: ["/", "/api/proof-image/"],
      disallow: [
        "/api",
        ...routing.locales.map((locale) => `/${locale}/admin`),
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
