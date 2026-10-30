"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// The verify-by-code-or-link flow shared by the owner registration screen
// and the guest news & offers box. Both post to the same registration
// routes; the server decides whether the person becomes the owner or a
// guest.

// From the emailed magic link (?verify=<id>.<token>), verified on mount
// rather than during the server render, so a GET alone never registers.
export type LinkVerification = { verificationId: string; linkToken: string };

type Step =
  | { kind: "form" }
  | { kind: "code"; verificationId: string; sent: boolean }
  | { kind: "verifyingLink" };

export type VerifiedStatus = "claimed" | "joined" | "alreadyClaimed";

export const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100";
export const buttonClass =
  "inline-flex w-full items-center justify-center rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50";

export function useEmailVerification({
  token,
  linkVerification,
  onVerified,
}: {
  token: string;
  linkVerification: LinkVerification | null;
  onVerified: (status: VerifiedStatus) => void;
}) {
  const t = useTranslations("proof.registration");

  const [step, setStep] = useState<Step>(
    linkVerification ? { kind: "verifyingLink" } : { kind: "form" },
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const linkVerified = useRef(false);

  function errorMessage(data: unknown) {
    const {
      error: reason,
      attemptsLeft,
      retryAfterSeconds,
    } = (data ?? {}) as {
      error?: string;
      attemptsLeft?: number;
      retryAfterSeconds?: number;
    };

    switch (reason) {
      case "invalidName":
        return t("errorName");
      case "invalidEmail":
        return t("errorEmail");
      case "consentRequired":
        return t("errorConsent");
      case "wrong":
        return t("errorWrongCode", { count: attemptsLeft ?? 0 });
      case "expired":
      case "tooManyAttempts":
        return t("errorExpired");
      case "used":
        return t("errorUsed");
      case "rateLimited":
        return t("errorRetryAfter", { seconds: retryAfterSeconds ?? 60 });
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

  function finishVerification(data: unknown) {
    // Drop ?verify=… so a reload doesn't try the used link again.
    window.history.replaceState(null, "", window.location.pathname);
    onVerified((data as { status: VerifiedStatus }).status);
  }

  useEffect(() => {
    if (!linkVerification || linkVerified.current) return;
    linkVerified.current = true;

    (async () => {
      const { ok, data } = await post("/verify", linkVerification);
      if (ok) {
        finishVerification(data);
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setError(errorMessage(data));
      setStep({ kind: "form" });
    })();
    // Runs once for the link the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestCode(
    details: {
      name: string;
      email: string;
      marketingConsent: boolean;
      locale: string;
    },
    resend: boolean,
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);

    const { ok, data } = await post("", { ...details, resend });

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

  async function verifyCode() {
    if (step.kind !== "code") return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const { ok, data } = await post("/verify", {
      verificationId: step.verificationId,
      code,
    });

    if (ok) {
      finishVerification(data);
      return;
    }

    setBusy(false);
    setError(errorMessage(data));
  }

  function backToForm() {
    setStep({ kind: "form" });
    setError(null);
    setNotice(null);
  }

  return {
    step,
    code,
    setCode,
    busy,
    error,
    notice,
    requestCode,
    verifyCode,
    backToForm,
  };
}

export function VerificationCodeForm({
  verification,
  email,
  verifyLabel,
  onResend,
}: {
  verification: ReturnType<typeof useEmailVerification>;
  email: string;
  verifyLabel: string;
  onResend: () => void;
}) {
  const t = useTranslations("proof.registration");
  const codeId = useId();
  const { step, code, setCode, busy, verifyCode, backToForm } = verification;

  if (step.kind !== "code") return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verifyCode();
      }}
      className="mt-6 space-y-4"
    >
      <p className="text-center text-gray-600">
        {step.sent ? t("codeSent", { email }) : t("codeAlreadySent", { email })}
      </p>

      <div>
        <label
          htmlFor={codeId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {t("codeLabel")}
        </label>
        <input
          id={codeId}
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
        {busy ? t("verifying") : verifyLabel}
      </button>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        <button
          type="button"
          onClick={onResend}
          disabled={busy}
          className="font-medium text-brand-green underline disabled:opacity-50"
        >
          {t("resend")}
        </button>
        <button
          type="button"
          onClick={backToForm}
          disabled={busy}
          className="font-medium text-gray-500 underline disabled:opacity-50"
        >
          {t("changeEmail")}
        </button>
      </div>
    </form>
  );
}

export function VerificationMessages({
  verification,
}: {
  verification: ReturnType<typeof useEmailVerification>;
}) {
  const { notice, error } = verification;

  return (
    <>
      {notice ? (
        <p className="mt-4 text-center text-sm text-green-700">{notice}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </>
  );
}
