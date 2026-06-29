"use client";

import React from "react";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "../i18n/routing";
import LanguageSwitcher from "../components/LanguageSwitcher";

const blur = () => {
  const el = document.activeElement as HTMLElement | null;
  if (el) el.blur();
};

type Props = {
  isAdmin: boolean;
};

const NavBar = ({ isAdmin }: Props) => {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <a
          href="https://www.facebook.com/share/jpVp8s9n6sw2aGfd"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-circle"
        >
          <FontAwesomeIcon
            icon={faFacebook}
            size="2xl"
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
            size="2xl"
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
        <ul className="menu menu-horizontal hidden px-1 font-semibold lg:flex">
          <li>
            <Link href="/albums">{t("albums")}</Link>
          </li>
          <li>
            <Link href="/about">{t("about")}</Link>
          </li>
          <li>
            <Link href="/contact">{t("contact")}</Link>
          </li>

          {isAdmin ? (
            <li>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
              >
                Logout
              </button>
            </li>
          ) : null}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>

          <ul
            tabIndex={0}
            className="menu dropdown-content absolute right-0 z-50 mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
          >
            <li>
              <Link href="/albums" onClick={blur}>
                {t("albums")}
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={blur}>
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" onClick={blur}>
                {t("contact")}
              </Link>
            </li>

            {isAdmin ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    blur();
                    signOut({ callbackUrl: `/${locale}` });
                  }}
                >
                  Logout
                </button>
              </li>
            ) : null}

            <LanguageSwitcher />
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavBar;