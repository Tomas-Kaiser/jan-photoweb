"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ConsentValue = "accepted" | "rejected" | null;

const COOKIE_NAME = "site_consent_external";

function getCookie(name: string) {
    if (typeof document === "undefined") return null;

    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function readConsentCookie(): ConsentValue {
    const saved = getCookie(COOKIE_NAME);
    return saved === "accepted" || saved === "rejected" ? saved : null;
}

function setCookie(name: string, value: string, days = 180) {
    const expires = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000
    ).toUTCString();

    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

export default function CookieConsentBanner() {
    const t = useTranslations("cookieConsent");
    const [mounted, setMounted] = useState(false);
    const [consent, setConsent] = useState<ConsentValue>(null);
    const [isReopened, setIsReopened] = useState(false);

    useEffect(() => {
        setMounted(true);
        setConsent(readConsentCookie());

        const openBanner = () => {
            setIsReopened(true);
            setConsent(readConsentCookie());
        };

        window.addEventListener("open-cookie-consent", openBanner);

        return () => {
            window.removeEventListener("open-cookie-consent", openBanner);
        };
    }, []);

    if (!mounted) return null;

    const isOpen = consent === null || isReopened;

    if (!isOpen) return null;

    const handleChoice = (value: Exclude<ConsentValue, null>) => {
        setCookie(COOKIE_NAME, value);
        setConsent(value);
        setIsReopened(false);
        window.dispatchEvent(new Event("consent-updated"));
    };

    const handleClose = () => {
        setIsReopened(false);
        setConsent(readConsentCookie());
    };

    return (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-black/10 bg-white p-4 shadow-xl">
            <p className="text-sm text-gray-700">
                {t("line1")} {t("line2")}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-end">
                {isReopened && (
                    <button
                        type="button"
                        onClick={handleClose}
                        className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        {t("close")}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => handleChoice("rejected")}
                    className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                    {t("rejectOptional")}
                </button>

                <button
                    type="button"
                    onClick={() => handleChoice("accepted")}
                    className="cursor-pointer rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    {t("acceptOptional")}
                </button>
            </div>
        </div>
    );
}