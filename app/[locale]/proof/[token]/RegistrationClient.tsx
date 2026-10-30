"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/app/i18n/routing";

type Props = {
  token: string;
  locale: string;
  clientName: string;
  // From the emailed magic link (?verify=<id>.<token>), verified on mount
  // rather than during the server render, so a GET alone never claims.
  linkVerification: { verificationId: string; linkToken: string } | null;
};

type Step =
  | { kind: "form" }
  | { kind: "code"; verificationId: string; sent: boolean }
  | { kind: "verifyingLink" };

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

  const [step, setStep] = useState<Step>(
    linkVerification ? { kind: "verifyingLink" } : { kind: "form" },
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const linkVerified = useRef(false);

  function errorMessage(data: unknown) {
    const { error: reason, attemptsLeft, retryAfterSeconds } = (data ?? {}) as {
      error?: string;
      attemptsLeft?: number;
      retryAfterSeconds?: number | null;
    };

    switch (reason) {
      case "invalidName":
        return t("errorName");
      case "invalidEmail":
        return t("errorEmail");
      case "wrong":
        return t("errorWrongCode", { count: attemptsLeft ?? 0 });
      case "expired":
      case "tooManyAttempts":
        return t("errorExpired");
      case "used":
        return t("errorUsed");
      case "rateLimited":
        return retryAfterSeconds
          ? t("errorRetryAfter", { seconds: retryAfterSeconds })
          : t("errorTryLater");
      default:
        return t("errorGeneric");
    }
  }

  async function post(path: string, body: unknown) {
    try {
      const res = await fetch(`/api/proof/${token}/registration${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: null };
    }
  }

  function showGallery() {
    // Drop ?verify=… so a reload doesn't try the used link again.
    window.history.replaceState(null, "", window.location.pathname);
    router.refresh();
  }

  useEffect(() => {
    if (!linkVerification || linkVerified.current) return;
    linkVerified.current = true;

    (async () => {
      const { ok, data } = await post("/verify", linkVerification);
      if (ok) {
        showGallery();
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setError(errorMessage(data));
      setStep({ kind: "form" });
    })();
    // Runs once for the link the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestCode(resend: boolean) {
    setBusy(true);
    setError(null);
    setNotice(null);

    const { ok, data } = await post("", {
      name,
      email,
      marketingConsent,
      locale,
      resend,
    });

    setBusy(false);

    if (!ok) {
      setError(errorMessage(data));
      return;
    }

    const { verificationId, sent } = data as {
      verificationId: string;
      sent: boolean;
    };
    setCode("");
    setStep({ kind: "code", verificationId, sent });
    if (resend) setNotice(t("resent"));
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step.kind !== "code") return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const { ok, data } = await post("/verify", {
      verificationId: step.verificationId,
      code,
    });

    if (ok) {
      showGallery();
      return;
    }

    setBusy(false);
    setError(errorMessage(data));
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100";
  const buttonClass =
    "inline-flex w-full items-center justify-center rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50";

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
              requestCode(false);
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

        {step.kind === "code" ? (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <p className="text-center text-gray-600">
              {step.sent
                ? t("codeSent", { email })
                : t("codeAlreadySent", { email })}
            </p>

            <div>
              <label
                htmlFor="registration-code"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t("codeLabel")}
              </label>
              <input
                id="registration-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\s*(\d\s*){6}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={busy}
                className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
              />
            </div>

            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? t("verifying") : t("verify")}
            </button>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
              <button
                type="button"
                onClick={() => requestCode(true)}
                disabled={busy}
                className="font-medium text-brand-green underline disabled:opacity-50"
              >
                {t("resend")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep({ kind: "form" });
                  setError(null);
                  setNotice(null);
                }}
                disabled={busy}
                className="font-medium text-gray-500 underline disabled:opacity-50"
              >
                {t("changeEmail")}
              </button>
            </div>
          </form>
        ) : null}

        {notice ? (
          <p className="mt-4 text-center text-sm text-green-700">{notice}</p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
