"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";
import { IoArrowForward, IoMailOutline } from "react-icons/io5";

import { Link, usePathname } from "../i18n/routing";

const Footer = () => {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isContact = pathname.startsWith("/contact");
  const currentYear = String(new Date().getFullYear());

  const navLinks = [
    { href: "/", label: tCommon("home") },
    { href: "/albums", label: tCommon("albums") },
    { href: "/services", label: tCommon("services") },
    { href: "/about", label: tCommon("about") },
    { href: "/contact", label: tCommon("contact") },
  ] as const;

  const linkClass =
    "text-gray-600 transition hover:text-black";

  return (
    <footer className="mt-16">
      {isLanding && (
        <div className="bg-[linear-gradient(to_bottom,transparent_50%,var(--color-base-200)_50%)] px-6">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-stone-100/60 to-stone-300/50 px-6 py-12 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] backdrop-blur-xl md:px-12 md:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl text-3xl font-bold text-gray-900 md:text-4xl">
                {t("heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-700">
                {t("text")}
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                {t("btn")}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div
        className={`bg-base-200 px-6 pb-8 ${isLanding ? "pt-16" : "pt-12"}`}
      >
        {!isLanding && !isContact && (
          <div className="mx-auto mb-12 flex max-w-5xl flex-col items-start gap-6 border-b border-black/10 pb-12 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {t("heading")}
              </h2>
              <p className="mt-2 text-gray-600">{t("text")}</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              {t("btn")}
              <IoArrowForward className="h-4 w-4" />
            </Link>
          </div>
        )}
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="flex flex-col font-semibold leading-none text-black">
              <span className="text-xl">Jan Hájek</span>
              <span className="mt-1 text-[0.65rem] font-medium tracking-[0.2em]">
                PHOTOGRAPHY
              </span>
            </div>
            <p className="mt-4 max-w-xs text-gray-600">{t("tagline")}</p>
          </div>

          <nav aria-label={t("navigate")}>
            <h3 className="text-sm font-semibold text-black">
              {t("navigate")}
            </h3>
            <ul className="mt-4 space-y-3">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold text-black">
              {t("getInTouch")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/contact"
                  className={`inline-flex items-center gap-2 ${linkClass}`}
                >
                  <IoMailOutline className="h-4 w-4" />
                  {t("sendMessage")}
                </Link>
              </li>
              <li className="flex items-center gap-4 pt-1">
                <a
                  href="https://www.facebook.com/share/jpVp8s9n6sw2aGfd"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className={linkClass}
                >
                  <FontAwesomeIcon icon={faFacebook} size="xl" />
                </a>
                <a
                  href="https://www.instagram.com/yenhighjack/?igsh=Yzl0eW1wMGkxN3po&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className={linkClass}
                >
                  <FontAwesomeIcon icon={faInstagram} size="xl" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center gap-2 border-t border-black/10 pt-6 text-sm text-gray-600 sm:flex-row sm:justify-between">
          <span>
            {t("copyrightPrefix")} {currentYear} {t("copyrightText")}{" "}
            <a
              href="https://kaiserwebstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition hover:text-black"
            >
              {t("creditName")}
            </a>
          </span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-cookie-consent"))}
            className="cursor-pointer underline underline-offset-4 transition hover:text-black"
          >
            {t("cookieSettings")}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
