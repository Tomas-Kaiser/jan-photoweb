"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/routing";
import { updateProofGallery } from "@/app/utils/proof-gallery-admin-api";
import type { GalleryEventType } from "@/app/lib/gallery-event-type";
import EventTypeSelect from "../EventTypeSelect";

type Props = {
  galleryId: string;
  initialEventType: GalleryEventType | null;
};

// The kind of shoot — editable at every stage, so it sits outside the stage
// panels.
export default function EventTypeSection({
  galleryId,
  initialEventType,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [eventType, setEventType] = useState(initialEventType);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setSaved(null);

    const result = await updateProofGallery(galleryId, {
      eventType,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? t("proofGalleries.eventTypeSaveFailed"));
      return;
    }

    setSaved(t("proofGalleries.eventTypeSaved"));
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
      <form onSubmit={handleSave} className="space-y-3">
        <label
          htmlFor="eventType"
          className="block text-sm font-medium text-gray-700"
        >
          {t("proofGalleries.eventTypeLabel")}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <EventTypeSelect
            id="eventType"
            value={eventType}
            onChange={(next) => {
              setEventType(next);
              setSaved(null);
            }}
            disabled={saving}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500 sm:w-64"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {t("proofGalleries.eventTypeHint")}
        </p>

        {saved ? <p className="text-sm text-green-700">{saved}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </section>
  );
}
