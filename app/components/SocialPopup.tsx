"use client";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";

const SCROLL_THRESHOLD = 0.35;

const links = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/yenhighjack/?igsh=Yzl0eW1wMGkxN3po&utm_source=qr",
    icon: faInstagram,
    className: "hover:text-pink-600",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/jpVp8s9n6sw2aGfd",
    icon: faFacebook,
    className: "hover:text-blue-600",
  },
] as const;

export default function SocialPopup() {
  const [scrolled, setScrolled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = scrolled && !dismissed;

  useEffect(() => {
    const onScroll = () => {
      const pageHeight = document.documentElement.scrollHeight;
      setScrolled(window.scrollY > pageHeight * SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed right-4 bottom-6 z-40 flex flex-col gap-2 rounded-full border border-white/40 bg-white/70 p-2 shadow-xl backdrop-blur-md transition-all duration-500 ${visible
        ? "translate-y-0 opacity-100"
        : "pointer-events-none translate-y-6 opacity-0"
        }`}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss social links"
        tabIndex={visible ? 0 : -1}
        className="flex h-7 w-11 items-center justify-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-900"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {links.map(({ label, href, icon, className }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          tabIndex={visible ? 0 : -1}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-gray-900 transition hover:scale-110 hover:bg-white ${className}`}
        >
          <FontAwesomeIcon icon={icon} size="lg" />
        </a>
      ))}
    </div>
  );
}
