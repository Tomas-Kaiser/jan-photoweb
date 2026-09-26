"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "../i18n/routing";
import NavBar from "./NavBar";
import Footer from "./Footer";
import LanguageSwitcher from "../components/LanguageSwitcher";

type Props = {
  isAdmin: boolean;
  children: React.ReactNode;
};

// Client proof pages are a focused task (select and submit) with selections
// held only in the browser until submit, so they get a minimal header/footer
// with no navigation away instead of the full site chrome.
function ProofHeader() {
  return (
    <header className="relative z-30 border-b border-brand-gold/15 bg-white/50 text-brand-green backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-4">
        <div className="flex flex-col items-center font-semibold leading-none">
          <span className="font-display text-2xl font-semibold">Jan Hájek</span>
          <span className="mt-1 text-[0.65rem] font-medium tracking-[0.2em]">
            PHOTOGRAPHY
          </span>
        </div>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-6">
        <LanguageSwitcher />
      </div>
    </header>
  );
}

function ProofFooter() {
  const t = useTranslations("footer");
  const currentYear = String(new Date().getFullYear());

  return (
    <footer className="border-t border-brand-gold/15 bg-brand-cream py-6">
      <div className="flex flex-col items-center space-y-2 px-6 text-center">
        <div className="text-sm text-brand-green/70">
          {t("copyrightPrefix")} {currentYear} {t("copyrightText")}
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-cookie-consent"))}
          className="cursor-pointer text-sm text-brand-green/70 underline underline-offset-4 transition hover:text-brand-green"
        >
          {t("cookieSettings")}
        </button>
      </div>
    </footer>
  );
}

export default function SiteChrome({ isAdmin, children }: Props) {
  const pathname = usePathname();
  const isProofPage = pathname.startsWith("/proof/");

  return (
    <div
      className={`flex min-h-screen flex-col ${isProofPage ? "bg-brand-cream" : ""}`}
    >
      {isProofPage ? <ProofHeader /> : <NavBar isAdmin={isAdmin} />}
      <main className="flex-1">{children}</main>
      {isProofPage ? <ProofFooter /> : <Footer />}
    </div>
  );
}
