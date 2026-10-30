"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/routing";
import { useConfirm } from "@/app/components/ConfirmDialog";
import {
  clearContactConsent,
  deleteContact,
  type ApiResult,
} from "@/app/utils/proof-gallery-admin-api";

type Props = {
  contact: {
    id: string;
    name: string;
    hasConsent: boolean;
    ownsGallery: boolean;
  };
};

export default function ContactActions({ contact }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action: () => Promise<ApiResult>,
    fallbackError: string,
  ) {
    setBusy(true);
    setError(null);

    const result = await action();

    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? fallbackError);
      return;
    }

    router.refresh();
  }

  async function handleClearConsent() {
    const confirmed = await confirm({
      title: t("contacts.clearConsentConfirmTitle"),
      message: t("contacts.clearConsentConfirmMessage", { name: contact.name }),
      confirmLabel: t("contacts.clearConsent"),
    });
    if (!confirmed) return;

    await run(
      () => clearContactConsent(contact.id),
      t("contacts.clearConsentFailed"),
    );
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: t("contacts.deleteConfirmTitle"),
      message: (
        <>
          <p>{t("contacts.deleteConfirmMessage", { name: contact.name })}</p>
          {contact.ownsGallery ? (
            <p className="mt-2">{t("contacts.deleteConfirmOwnerNote")}</p>
          ) : null}
        </>
      ),
      confirmLabel: t("contacts.delete"),
      danger: true,
    });
    if (!confirmed) return;

    await run(() => deleteContact(contact.id), t("contacts.deleteFailed"));
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex flex-wrap gap-3">
        {contact.hasConsent ? (
          <button
            type="button"
            onClick={handleClearConsent}
            disabled={busy}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500 disabled:opacity-50"
          >
            {t("contacts.clearConsent")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:border-red-400 disabled:opacity-50"
        >
          {t("contacts.delete")}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
