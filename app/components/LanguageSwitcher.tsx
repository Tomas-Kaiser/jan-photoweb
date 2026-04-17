"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "../i18n/routing"; // Use the navigation from your routing file
import { IoEarth } from "react-icons/io5";

export default function LanguageSwitcher() {
  const locale = useLocale(); // Gets current lang ("en" or "cs")
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (nextLocale: "en" | "cs") => {
    // This updates the URL (e.g., /en/dashboard -> /cs/dashboard)
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <IoEarth className="h-5 w-5" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-40 z-50"
      >
        <li>
          <button
            onClick={() => changeLanguage("en")}
            className={locale === "en" ? "active bg-base-300" : ""}
          >
            🇬🇧 English
          </button>
        </li>
        <li>
          <button
            onClick={() => changeLanguage("cs")}
            className={locale === "cs" ? "active bg-base-300" : ""}
          >
            🇨🇿 Čeština
          </button>
        </li>
      </ul>
    </div>
  );
}
