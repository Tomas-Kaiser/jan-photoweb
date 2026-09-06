"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  const t = useTranslations("footer");
  const currentYear = String(new Date().getFullYear());

  return (
    <footer className="bg-base-200 py-4">
      <div className="bg-gradient-to-r px-6 py-10 text-center">
        <h2 className="mb-4 text-3xl font-semibold">
          {t("heading")}
        </h2>
        <p className="mb-6 text-lg">
          {t("text")}
        </p>
        <Link
          href="/contact"
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-black px-10 py-4 text-lg font-semibold text-white transition hover:bg-gray-800"
        >
          {t("btn")}
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center space-x-2">
          <a
            href="https://www.facebook.com/share/jpVp8s9n6sw2aGfd"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-circle"
          >
            <FontAwesomeIcon
              icon={faFacebook}
              size="2x"
              className="text-black"
            />
          </a>

          <a
            href="https://www.instagram.com/yenhighjack/?igsh=Yzl0eW1wMGkxN3po&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-circle"
          >
            <FontAwesomeIcon
              icon={faInstagram}
              size="2x"
              className="text-black"
            />
          </a>
        </div>

        <div className="text-sm text-gray-600">
          {t("copyrightPrefix")} {currentYear} {t("copyrightText")}
        </div>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-cookie-consent"))}
          className="text-sm cursor-pointer text-gray-600 underline underline-offset-4 transition hover:text-black"
        >
          {t("cookieSettings")}
        </button>
      </div>
    </footer>
  );
};

export default Footer;