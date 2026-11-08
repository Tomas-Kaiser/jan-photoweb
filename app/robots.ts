import type { MetadataRoute } from "next";

import { routing } from "./i18n/routing";
import { siteUrl } from "./lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        ...routing.locales.map((locale) => `/${locale}/admin`),
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
