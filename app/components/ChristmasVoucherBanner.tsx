"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "../i18n/routing";

const STORAGE_KEY = "christmas-voucher-banner-dismissed";
const SHOW_DELAY_MS = 4000;

function isInSeason(now: Date) {
  const year = now.getFullYear();
  const seasonStart = new Date(year, 8, 17); // Sep 17
  const seasonEnd = new Date(year, 11, 26, 23, 59, 59); // Dec 26
  return now >= seasonStart && now <= seasonEnd;
}

export default function ChristmasVoucherBanner() {
  const t = useTranslations("christmasBanner");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isInSeason(new Date())) return;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode, etc.) — fall back to showing it
    }
    if (dismissed) return;

    const showTimer = window.setTimeout(() => setMounted(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // mount collapsed first, then flip open on the next frame so the
    // grid-rows transition actually animates instead of snapping open
    const raf = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(raf);
  }, [mounted]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore write failures, banner just reappears next visit
    }
    window.setTimeout(() => setMounted(false), 700);
  };

  if (!mounted) return null;

  return (
    <div
      className={`grid overflow-hidden transition-[grid-template-rows] duration-700 ease-in-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div
        className={`relative flex min-h-0 flex-col items-center justify-center gap-2 bg-emerald-900 px-10 py-3 text-center text-sm text-white transition-opacity duration-700 ease-in-out sm:flex-row sm:gap-4 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        <span>
          <span aria-hidden="true">🎅</span> {t("message")}
        </span>
        <Link
          href={{ pathname: "/contact", query: { service: "voucher" } }}
          className="font-semibold underline underline-offset-4 hover:text-emerald-100"
        >
          {t("cta")}
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("close")}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-lg leading-none text-white/80 hover:text-white"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
