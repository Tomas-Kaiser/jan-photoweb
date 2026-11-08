import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { auth } from "@/auth";
import { routing } from "../i18n/routing";
import { siteUrl } from "../lib/site-url";
import SiteChrome from "./SiteChrome";
import CookieConsentBanner from "../components/consent/CookieConsentBanner";
import { ToastProvider } from "../components/Toast";
import { ConfirmProvider } from "../components/ConfirmDialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jan Hájek - Photography",
  description: "Photography portfolio of Jan Hájek.",
  icons: {
    icon: "/icon.png",
  },
};

function getStructuredData(locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: "Jan Hájek",
        alternateName: "Jan Hajek",
        jobTitle: "Photographer",
        url: siteUrl,
        sameAs,
      },
      {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#business`,
        name: "Jan Hájek Photography",
        description,
        url: `${siteUrl}/${locale}`,
        image: `${siteUrl}/opengraph-image.png`,
        founder: { "@id": `${siteUrl}/#person` },
        address: {
          "@type": "PostalAddress",
          addressRegion: "Ústecký kraj",
          addressCountry: "CZ",
        },
        areaServed: { "@type": "Country", name: "Czech Republic" },
        sameAs,
      },
    ],
  };
}

const sameAs = [
  "https://www.instagram.com/yenhighjack/",
  "https://www.facebook.com/share/jpVp8s9n6sw2aGfd",
  "https://www.google.com/maps/place/Fotograf+Jan+H%C3%A1jek/@51.011085,-6.2617611,5z/data=!4m10!1m2!2m1!1shajek+jan+fotograf!3m6!1s0xa2490db466896cd3:0x9724b51fa6006b7d!8m2!3d50.4621918!4d13.7458963!15sChJoYWplayBqYW4gZm90b2dyYWaSAQxwaG90b2dyYXBoZXLgAQA!16s%2Fg%2F11x8z_y162?entry=ttu&g_ep=EgoyMDI2MDkxNC4wIKXMDSoASAFQAw%3D%3D",
];

type ConsentValue = "accepted" | "rejected" | null;

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  const cookieStore = await cookies();
  const rawConsent = cookieStore.get("site_consent_external")?.value;

  const initialConsent: ConsentValue =
    rawConsent === "accepted" || rawConsent === "rejected" ? rawConsent : null;

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getStructuredData(locale, tSeo("home.description"))),
        }}
      />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ToastProvider>
          <ConfirmProvider>
            <SiteChrome isAdmin={isAdmin}>{props.children}</SiteChrome>
            <CookieConsentBanner initialConsent={initialConsent} />
          </ConfirmProvider>
        </ToastProvider>
      </NextIntlClientProvider>
    </div>
  );
}
