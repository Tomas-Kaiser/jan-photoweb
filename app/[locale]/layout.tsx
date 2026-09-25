import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { auth } from "@/auth";
import { routing } from "../i18n/routing";
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

const personStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jan Hájek",
  alternateName: "Jan Hajek",
  jobTitle: "Photographer",
};

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
          __html: JSON.stringify(personStructuredData),
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
