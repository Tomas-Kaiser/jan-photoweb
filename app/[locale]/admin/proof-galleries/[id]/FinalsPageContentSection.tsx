"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { uploadPhotoToCloudflare } from "@/app/utils/upload-photo-to-cloudflare";

type Props = {
  galleryId: string;
  initialEventDate: string;
  initialFinalsMessage: string;
  initialHeroMobileCloudflareId: string | null;
  initialHeroDesktopCloudflareId: string | null;
};

type HeroSlot = "heroMobileCloudflareId" | "heroDesktopCloudflareId";

export default function FinalsPageContentSection({
  galleryId,
  initialEventDate,
  initialFinalsMessage,
  initialHeroMobileCloudflareId,
  initialHeroDesktopCloudflareId,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [eventDate, setEventDate] = useState(initialEventDate);
  const [finalsMessage, setFinalsMessage] = useState(initialFinalsMessage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [heroMobileCloudflareId, setHeroMobileCloudflareId] = useState(
    initialHeroMobileCloudflareId,
  );
  const [heroDesktopCloudflareId, setHeroDesktopCloudflareId] = useState(
    initialHeroDesktopCloudflareId,
  );
  const [uploadingSlot, setUploadingSlot] = useState<HeroSlot | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);

  async function saveHeroField(slot: HeroSlot, cloudflareId: string | null) {
    const res = await fetch(`/api/admin/proof-galleries/${galleryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [slot]: cloudflareId ?? "" }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || t("finalDelivery.heroPhotoSaveFailed"));
    }
  }

  async function handleHeroUpload(slot: HeroSlot, file: File) {
    setUploadingSlot(slot);
    setHeroError(null);

    try {
      const { cloudflareId } = await uploadPhotoToCloudflare(file);
      await saveHeroField(slot, cloudflareId);

      if (slot === "heroMobileCloudflareId") {
        setHeroMobileCloudflareId(cloudflareId);
      } else {
        setHeroDesktopCloudflareId(cloudflareId);
      }
      router.refresh();
    } catch (err) {
      setHeroError(
        err instanceof Error
          ? err.message
          : t("finalDelivery.heroPhotoSaveFailed"),
      );
    } finally {
      setUploadingSlot(null);
      if (mobileInputRef.current) mobileInputRef.current.value = "";
      if (desktopInputRef.current) desktopInputRef.current.value = "";
    }
  }

  async function handleHeroRemove(slot: HeroSlot) {
    setUploadingSlot(slot);
    setHeroError(null);

    try {
      await saveHeroField(slot, null);

      if (slot === "heroMobileCloudflareId") {
        setHeroMobileCloudflareId(null);
      } else {
        setHeroDesktopCloudflareId(null);
      }
      router.refresh();
    } catch (err) {
      setHeroError(
        err instanceof Error
          ? err.message
          : t("finalDelivery.heroPhotoSaveFailed"),
      );
    } finally {
      setUploadingSlot(null);
    }
  }

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
        throw new Error(
          data?.error || t("finalDelivery.pageContentSaveFailed"),
        );
      }

      setSaved(t("finalDelivery.pageContentSaved"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("finalDelivery.pageContentSaveFailed"),
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

      <div className="mb-6 space-y-4 border-b border-gray-100 pb-6">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {t("finalDelivery.heroPhotosTitle")}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {t("finalDelivery.heroPhotosHint")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              slot: "heroMobileCloudflareId" as const,
              label: t("finalDelivery.heroMobileLabel"),
              cloudflareId: heroMobileCloudflareId,
              inputRef: mobileInputRef,
            },
            {
              slot: "heroDesktopCloudflareId" as const,
              label: t("finalDelivery.heroDesktopLabel"),
              cloudflareId: heroDesktopCloudflareId,
              inputRef: desktopInputRef,
            },
          ].map(({ slot, label, cloudflareId, inputRef }) => (
            <div key={slot}>
              <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>

              {cloudflareId ? (
                <div className="group relative aspect-video overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={getCloudflareImageUrl(cloudflareId, "card")}
                    alt={label}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleHeroRemove(slot)}
                    disabled={uploadingSlot !== null}
                    className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingSlot === slot
                      ? t("common.saving")
                      : t("common.delete")}
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={slot}
                  className="flex aspect-video cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm font-medium text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream"
                >
                  {uploadingSlot === slot
                    ? t("common.uploading")
                    : t("finalDelivery.chooseHeroPhoto")}
                  <input
                    ref={inputRef}
                    id={slot}
                    type="file"
                    accept="image/*"
                    disabled={uploadingSlot !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleHeroUpload(slot, file);
                    }}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          ))}
        </div>

        {heroError ? <p className="text-sm text-red-700">{heroError}</p> : null}
      </div>

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
