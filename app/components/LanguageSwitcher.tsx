"use client";

import { useState } from "react";
import i18n from "../i18n/i18n";
import { IoEarth } from "react-icons/io5";

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const current = i18n.language; // "en" or "cs"

  const changeToEnglish = () => {
    i18n.changeLanguage("en");
    setOpen(false);
  };
  const changeToCzech = () => {
    i18n.changeLanguage("cs");
    setOpen(false);
  };

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <IoEarth className="h-5 w-5" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-40 z-50"
      >
        <li>
          <button
            onClick={changeToEnglish}
            className={current === "en" ? "active bg-base-300" : ""}
          >
            🇬🇧 English
          </button>
        </li>
        <li>
          <button
            onClick={changeToCzech}
            className={current === "cs" ? "active bg-base-300" : ""}
          >
            🇨🇿 Čeština
          </button>
        </li>
      </ul>
    </div>
  );
}
