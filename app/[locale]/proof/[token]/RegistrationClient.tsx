"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/app/i18n/routing";
import {
  buttonClass,
  inputClass,
  useEmailVerification,
  VerificationCodeForm,
  VerificationMessages,
  type LinkVerification,
} from "./EmailVerification";
import { rememberGuestSignupDismissed } from "./GuestSignupClient";

type Props = {
  token: string;
  locale: string;
  clientName: string;
  linkVerification: LinkVerification | null;
};

// The owner registration gate shown instead of the finals until someone
// claims the gallery. Once verified, the page re-renders as the finals.
export default function RegistrationClient({
  token,
  locale,
  clientName,
  linkVerification,
}: Props) {
  const t = useTranslations("proof.registration");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const verification = useEmailVerification({
    token,
    linkVerification,
    onVerified: (status) => {
      // Whoever just claimed the gallery is its owner, not a guest to
      // offer the news & offers box to on the finals.
      if (status === "claimed") rememberGuestSignupDismissed();
      router.refresh();
    },
  });
  const { step, busy, requestCode } = verification;

  function sendCode(resend: boolean) {
    requestCode({ name, email, marketingConsent, locale }, resend);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-3xl bg-white p-7 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)] sm:p-10">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand-gold-dark">
          {clientName}
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold text-brand-green">
          {t("title")}
        </h1>

        {step.kind === "verifyingLink" ? (
          <p className="mt-6 text-center text-gray-600">{t("verifyingLink")}</p>
        ) : null}

        {step.kind === "form" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendCode(false);
            }}
            className="mt-6 space-y-4"
          >
            <p className="text-center text-gray-600">{t("intro")}</p>

            <div>
              <label
                htmlFor="registration-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t("nameLabel")}
              </label>
              <input
                id="registration-name"
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
                htmlFor="registration-email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t("emailLabel")}
              </label>
              <input
                id="registration-email"
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
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green"
              />
              <span>{t("marketingConsent")}</span>
            </label>

            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? t("sending") : t("submit")}
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

        <VerificationCodeForm
          verification={verification}
          email={email}
          verifyLabel={t("verify")}
          onResend={() => sendCode(true)}
        />

        <VerificationMessages verification={verification} />
      </div>
    </div>
  );
}
