"use client";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import JHLogo from "./components/JHLogo";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";

const blur = () => {
  const el = document.activeElement as HTMLElement | null;
  if (el) el.blur();
};

const NavBar = () => {
  const { t } = useTranslation();

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <a
          href="https://www.facebook.com/share/jpVp8s9n6sw2aGfd"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-circle"
        >
          <FontAwesomeIcon icon={faFacebook} size="lg" className="text-black" />
        </a>
        <a
          href="https://www.instagram.com/yenhighjack/?igsh=Yzl0eW1wMGkxN3po&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-circle"
        >
          <FontAwesomeIcon
            icon={faInstagram}
            size="lg"
            className="text-black"
          />
        </a>
      </div>
      <div className="navbar-center lg:flex">
        <Link href="/" className="mr-1 text-xl font-semibold">
          Jan Hajek
        </Link>
      </div>
      <div className="navbar-end">
        <ul className="menu menu-horizontal px-1 hidden lg:flex font-semibold">
          <li>
            <Link href={"/albums"}>{t("common.albums")}</Link>
          </li>
          <li>
            <Link href={"/about"}>{t("common.about")}</Link>
          </li>
          <li>
            <Link href={"/contact"}>{t("common.contact")}</Link>
          </li>
        </ul>
        <div className="hidden lg:flex">
          <LanguageSwitcher />
        </div>
        <div className="dropdown lg:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />{" "}
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content absolute right-0 bg-base-100 rounded-box mt-3 w-52 p-2 shadow z-50"
          >
            <li>
              <Link href={"/albums"} onClick={blur}>
                {t("common.albums")}
              </Link>
            </li>
            <li>
              <Link href={"/about"} onClick={blur}>
                {t("common.about")}
              </Link>
            </li>
            <li>
              <Link href={"/contact"} onClick={blur}>
                {t("common.contact")}
              </Link>
            </li>
            <LanguageSwitcher />
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
