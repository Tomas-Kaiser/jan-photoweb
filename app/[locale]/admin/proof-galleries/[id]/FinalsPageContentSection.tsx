"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  galleryId: string;
  initialEventDate: string;
  initialFinalsMessage: string;
};

export default function FinalsPageContentSection({
  galleryId,
  initialEventDate,
  initialFinalsMessage,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [eventDate, setEventDate] = useState(initialEventDate);
  const [finalsMessage, setFinalsMessage] = useState(initialFinalsMessage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setSaved(null);

    try {
      const res = await fetch(`/api/admin/proof-galleries/${galleryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate, finalsMessage }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("finalDelivery.pageContentSaveFailed"));
      }

      setSaved(t("finalDelivery.pageContentSaved"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("finalDelivery.pageContentSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
      <h2 className="font-display text-2xl font-semibold text-brand-green">
        {t("finalDelivery.pageContentTitle")}
      </h2>
      <p className="mb-5 mt-1 text-sm text-gray-500">
        {t("finalDelivery.pageContentHint")}
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label
            htmlFor="eventDate"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {t("finalDelivery.eventDateLabel")}
          </label>
          <input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500 sm:w-64"
          />
        </div>

        <div>
          <label
            htmlFor="finalsMessage"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {t("finalDelivery.finalsMessageLabel")}
          </label>
          <textarea
            id="finalsMessage"
            value={finalsMessage}
            onChange={(e) => setFinalsMessage(e.target.value)}
            disabled={saving}
            rows={5}
            placeholder={t("finalDelivery.finalsMessagePlaceholder")}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {saved ? <p className="text-sm text-green-700">{saved}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("common.saving") : t("finalDelivery.pageContentSave")}
        </button>
      </form>
    </section>
  );
}
