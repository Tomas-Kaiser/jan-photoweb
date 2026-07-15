"use client";

import { useEffect, useState } from "react";
import GoogleReviews from "../GoogleReviews";

const COOKIE_NAME = "site_consent_external";

function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export default function ConsentGate() {
    const [consent, setConsent] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const updateConsent = () => {
            setConsent(getCookie(COOKIE_NAME));
            setMounted(true);
        };

        updateConsent();
        window.addEventListener("consent-updated", updateConsent);

        return () => {
            window.removeEventListener("consent-updated", updateConsent);
        };
    }, []);

    if (!mounted) return null;

    if (consent === "accepted") {
        return <GoogleReviews />;
    }

    return (
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-700">
                Google Reviews are loaded from a third-party service and are disabled until you accept optional cookies.
            </p>
        </div>
    );
}