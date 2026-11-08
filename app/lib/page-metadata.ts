import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { routing } from "../i18n/routing";
import { siteUrl } from "./site-url";

type SeoPage = "home" | "services" | "about" | "albums" | "contact" | "privacy";

// `path` is the locale-less page path: "" for the homepage, "/about" otherwise.
export async function getPageMetadata(
  locale: string,
  page: SeoPage,
  path: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t(`${page}.title`),
    description: t(`${page}.description`),
    alternates: {
      canonical: `${siteUrl}/${locale}${path}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
      ),
    },
  };
}
