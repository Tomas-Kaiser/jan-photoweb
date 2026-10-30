"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/app/i18n/routing";
import {
  buttonClass,
  inputClass,
  useEmailVerification,
  VerificationCodeForm,
  VerificationMessages,
  type LinkVerification,
  type VerifiedStatus,
} from "./EmailVerification";

const DISMISSED_KEY = "guest-signup-dismissed";

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // localStorage unavailable (private mode, etc.) — show the box.
    return false;
  }
}

// Read once per render rather than subscribed to: only this box writes it,
// and it tracks its own dismissal in state.
function subscribeToNothing() {
  return () => {};
}

export function rememberGuestSignupDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Ignore: the box just shows again next visit.
  }
}

type Props = {
  token: string;
  linkVerification: LinkVerification | null;
};

// The optional "Get news & offers" box on the finals. Anyone viewing the
// finals can sign up as a guest of the gallery; consent is required here,
// since signing up for news & offers is all the box does.
export default function GuestSignupClient({ token, linkVerification }: Props) {
  const t = useTranslations("proof.guestSignup");
  const tRegistration = useTranslations("proof.registration");
  const locale = useLocale();
  const boxRef = useRef<HTMLDivElement>(null);

  // Hidden in the server render, so a dismissed box never flashes in.
  const storedDismissal = useSyncExternalStore(
    subscribeToNothing,
    readDismissed,
    () => true,
  );
  const [closed, setClosed] = useState(false);
  // Opened from the emailed link, the box shows regardless of dismissal.
  const [openedFromLink, setOpenedFromLink] = useState(
    linkVerification !== null,
  );
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  function handleVerified(status: VerifiedStatus) {
    // Nothing was registered (the start route requires consent, so this
    // shouldn't happen): back to normal.
    if (status === "alreadyClaimed") {
      setOpenedFromLink(false);
      return;
    }
    setJoined(true);
    rememberGuestSignupDismissed();
  }

  const verification = useEmailVerification({
    token,
    linkVerification,
    onVerified: handleVerified,
  });
  const { step, busy, requestCode } = verification;

  useEffect(() => {
    // The box sits below the photos; bring it into view for the link.
    if (linkVerification) {
      boxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [linkVerification]);

  function dismiss() {
    setClosed(true);
    rememberGuestSignupDismissed();
  }

  function sendCode(resend: boolean) {
    requestCode({ name, email, marketingConsent, locale }, resend);
  }

  if (closed || (storedDismissal && !openedFromLink && !joined)) return null;

  return (
    <div ref={boxRef} className="mx-auto max-w-xl px-6 pb-14 sm:px-10 sm:pb-20">
      <section className="relative rounded-3xl bg-white p-7 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)] sm:p-10">
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          ×
        </button>

        <h2 className="text-center font-display text-3xl font-semibold text-brand-green">
          {t("title")}
        </h2>

        {joined ? (
          <p className="mt-4 text-center text-gray-600">{t("thanks")}</p>
        ) : null}

        {!joined && step.kind === "verifyingLink" ? (
          <p className="mt-4 text-center text-gray-600">
            {tRegistration("verifyingLink")}
          </p>
        ) : null}

        {!joined && step.kind === "form" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendCode(false);
            }}
            className="mt-4 space-y-4"
          >
            <p className="text-center text-gray-600">{t("intro")}</p>

            <div>
              <label
                htmlFor="guest-signup-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {tRegistration("nameLabel")}
              </label>
              <input
                id="guest-signup-name"
                type="text"
                autoComplete="name"
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="guest-signup-email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {tRegistration("emailLabel")}
              </label>
              <input
                id="guest-signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                required
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green"
              />
              <span>{t("marketingConsent")}</span>
            </label>

            <button
              type="submit"
              disabled={busy || !marketingConsent}
              className={buttonClass}
            >
              {busy ? tRegistration("sending") : t("submit")}
            </button>

            <p className="text-center text-xs text-gray-500">
              {t.rich("privacyNotice", {
                link: (chunks) => (
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="underline hover:text-brand-green"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </form>
        ) : null}

        {!joined ? (
          <VerificationCodeForm
            verification={verification}
            email={email}
            verifyLabel={t("verify")}
            onResend={() => sendCode(true)}
          />
        ) : null}

        <VerificationMessages verification={verification} />
      </section>
    </div>
  );
}
