import type { MetadataRoute } from "next";

import { routing } from "./i18n/routing";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"
).replace(/\/$/, "");

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
