"use client";

import React from "react";
import Image from "next/image";
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
    <div className="sticky top-0 z-40">
      {isAdmin ? (
        <div className="relative flex items-center justify-center gap-4 bg-green-900 py-1.5 text-xs font-semibold text-white">
          <span className="uppercase tracking-wide">Admin enabled</span>
          <div className="hidden items-center gap-4 lg:absolute lg:right-6 lg:top-1/2 lg:flex lg:-translate-y-1/2">
            <Link href="/admin" className="underline-offset-2 hover:underline">
              Dashboard
            </Link>
            <button
              type="button"
              className="cursor-pointer underline-offset-2 hover:underline"
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}

      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <a
            href="https://www.facebook.com/honzik.hajek.5"
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
          <Link
            href="/"
            className="mr-1 flex flex-col items-center font-semibold leading-none"
          >
            <span className="text-xl">Jan Hájek</span>
            <span className="mt-1 text-[0.65rem] font-medium tracking-[0.2em]">
              PHOTOGRAPHY
            </span>
          </Link>
        </div>

        <div className="navbar-end">
          <ul className="menu menu-horizontal hidden px-1 text-base font-semibold lg:flex">
            <li>
              <Link href="/albums">{t("albums")}</Link>
            </li>
            <li>
              <Link href="/services">{t("services")}</Link>
            </li>
            <li>
              <a
                href="https://byjj.cz"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("workshops")}
              </a>
            </li>
            <li>
              <Link href="/about">{t("about")}</Link>
            </li>
            <li>
              <Link href="/contact">{t("contact")}</Link>
            </li>
          </ul>

          <div className="hidden lg:flex">
            <LanguageSwitcher />
          </div>

          <div className="dropdown dropdown-end lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost">
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
              className="menu dropdown-content z-50 mt-3 w-56 rounded-box bg-base-100 p-2 shadow"
            >
              <li className="pointer-events-none mb-1 flex items-center border-b border-base-200 pb-2">
                <Image
                  src="/icon.png"
                  alt="Jan Hájek Photography"
                  width={80}
                  height={72}
                  className="h-auto w-16"
                />
              </li>
              <li>
                <Link href="/albums" onClick={blur}>
                  {t("albums")}
                </Link>
              </li>
              <li>
                <Link href="/services" onClick={blur}>
                  {t("services")}
                </Link>
              </li>
              <li>
                <a
                  href="https://byjj.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={blur}
                >
                  {t("workshops")}
                </a>
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
                <>
                  <li className="menu-title mt-2 border-t border-base-200 pt-2 text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
                    Admin
                  </li>
                  <li>
                    <Link
                      href="/admin"
                      onClick={blur}
                      className="font-semibold text-green-800"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        blur();
                        signOut({ callbackUrl: `/${locale}` });
                      }}
                      className="font-semibold text-green-800"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : null}

              <li className="mt-1">
                <div className="px-2 py-1">
                  <LanguageSwitcher />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
