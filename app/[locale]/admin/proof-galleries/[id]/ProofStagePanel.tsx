"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/app/i18n/routing";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { uploadPhotoToCloudflare } from "@/app/utils/upload-photo-to-cloudflare";
import {
  addProofPhoto,
  deleteProofPhoto,
  updateProofGallery,
} from "@/app/utils/proof-gallery-admin-api";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import type {
  GalleryPermissions,
  GalleryStage,
} from "@/app/lib/gallery-lifecycle";
import { LockIcon } from "./LockedNotice";
import type { Gallery, ProofPhoto } from "./types";

type Props = {
  gallery: Gallery;
  initialPhotos: ProofPhoto[];
  stage: GalleryStage;
  permissions: GalleryPermissions;
};

// Pricing, the client message and the proof photos — editable only while the
// gallery is in the proof stage, read-only with a lock note after that.
export default function ProofStagePanel({
  gallery,
  initialPhotos,
  stage,
  permissions,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();

  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const [clientName, setClientName] = useState(gallery.clientName);
  const [baseCost, setBaseCost] = useState(String(gallery.baseCostCents / 100));
  const [freePhotoCount, setFreePhotoCount] = useState(
    String(gallery.freePhotoCount),
  );
  const [extraPhotoPrice, setExtraPhotoPrice] = useState(
    String(gallery.extraPhotoPriceCents / 100),
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [clientMessage, setClientMessage] = useState(gallery.message ?? "");
  const [savingClientMessage, setSavingClientMessage] = useState(false);
  const [clientMessageSaved, setClientMessageSaved] = useState<string | null>(
    null,
  );
  const [clientMessageError, setClientMessageError] = useState<string | null>(
    null,
  );

  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSettingsError(null);
    setSettingsMessage(null);

    const name = clientName.trim();
    const baseCostUnits = Number(baseCost || 0);
    const freeCount = Number(freePhotoCount);
    const priceUnits = Number(extraPhotoPrice);

    if (!name) {
      setSettingsError(t("proofGalleries.clientNameLabel"));
      return;
    }

    if (!Number.isFinite(baseCostUnits) || baseCostUnits < 0) {
      setSettingsError(t("proofGalleries.baseCostLabel"));
      return;
    }

    if (!Number.isFinite(freeCount) || freeCount < 0) {
      setSettingsError(t("proofGalleries.freePhotoCountLabel"));
      return;
    }

    if (!Number.isFinite(priceUnits) || priceUnits < 0) {
      setSettingsError(t("proofGalleries.extraPhotoPriceLabel"));
      return;
    }

    setSavingSettings(true);

    const result = await updateProofGallery(gallery.id, {
      clientName: name,
      baseCostCents: Math.round(baseCostUnits * 100),
      freePhotoCount: Math.round(freeCount),
      extraPhotoPriceCents: Math.round(priceUnits * 100),
    });

    setSavingSettings(false);

    if (!result.ok) {
      setSettingsError(result.error ?? t("proofGalleries.settingsSaveFailed"));
      return;
    }

    setSettingsMessage(t("proofGalleries.settingsSaved"));
    router.refresh();
  }

  async function handleSaveClientMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setClientMessageError(null);
    setClientMessageSaved(null);
    setSavingClientMessage(true);

    const result = await updateProofGallery(gallery.id, {
      message: clientMessage,
    });

    setSavingClientMessage(false);

    if (!result.ok) {
      setClientMessageError(
        result.error ?? t("proofGalleries.clientMessageSaveFailed"),
      );
      return;
    }

    setClientMessageSaved(t("proofGalleries.clientMessageSaved"));
    router.refresh();
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photosInputRef.current) photosInputRef.current.value = "";
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);

    const failures: string[] = [];

    for (const [index, file] of files.entries()) {
      setUploadStatus(
        t("upload.uploadingPhoto", {
          position: index + 1,
          total: files.length,
          name: file.name,
        }),
      );

      const upload = await uploadPhotoToCloudflare(file);
      if (!upload.ok) {
        failures.push(`${file.name}: ${upload.error.message}`);
        continue;
      }
      const { cloudflareId } = upload;

      const saved = await addProofPhoto(gallery.id, {
        cloudflareId,
        fileName: file.name,
      });
      if (!saved.ok) {
        failures.push(
          `${file.name}: ${saved.error ?? t("common.genericError")}`,
        );
        continue;
      }

      setPhotos((prev) => [
        ...prev,
        {
          id: saved.photoId,
          fileName: file.name,
          cardSrc: getCloudflareImageUrl(cloudflareId, "card"),
          selected: false,
          rating: null,
          comment: null,
        },
      ]);
    }

    setUploading(false);
    setUploadStatus(null);

    if (failures.length) {
      setUploadError(failures.join("\n"));
    }

    router.refresh();
  }

  async function handleDeletePhoto(photo: ProofPhoto) {
    const confirmed = await confirm({
      message: t("proofGalleries.deletePhotoConfirmMessage"),
      danger: true,
    });

    if (!confirmed) return;

    const result = await deleteProofPhoto(gallery.id, photo.id);

    if (!result.ok) {
      setUploadError(result.error ?? t("proofGalleries.deletePhotoFailed"));
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-green">
          {t("proofGalleries.settingsTitle")}
        </h2>

        {!permissions.canEditPricing ? (
          <div>
            <p className="mb-4 text-sm text-gray-500">
              {t("proofGalleries.settingsLockedNote")}
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">
                  {t("proofGalleries.clientNameLabel")}
                </dt>
                <dd className="font-medium text-gray-900">
                  {gallery.clientName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">
                  {t("proofGalleries.baseCostLabel")}
                </dt>
                <dd className="font-medium text-gray-900">
                  {formatMoneyFromCents(
                    gallery.baseCostCents,
                    gallery.currency,
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">
                  {t("proofGalleries.freePhotoCountLabel")}
                </dt>
                <dd className="font-medium text-gray-900">
                  {gallery.freePhotoCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">
                  {t("proofGalleries.extraPhotoPriceLabel")}
                </dt>
                <dd className="font-medium text-gray-900">
                  {formatMoneyFromCents(
                    gallery.extraPhotoPriceCents,
                    gallery.currency,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div>
              <label
                htmlFor="clientName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {t("proofGalleries.clientNameLabel")}
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={savingSettings}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="baseCost"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {t("proofGalleries.baseCostLabel")}
              </label>
              <input
                id="baseCost"
                type="number"
                min={0}
                step={1}
                value={baseCost}
                onChange={(e) => setBaseCost(e.target.value)}
                disabled={savingSettings}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t("proofGalleries.baseCostHint", {
                  currency: gallery.currency,
                })}
              </p>
            </div>

            <div>
              <label
                htmlFor="freePhotoCount"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {t("proofGalleries.freePhotoCountLabel")}
              </label>
              <input
                id="freePhotoCount"
                type="number"
                min={0}
                step={1}
                value={freePhotoCount}
                onChange={(e) => setFreePhotoCount(e.target.value)}
                disabled={savingSettings}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="extraPhotoPrice"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {t("proofGalleries.extraPhotoPriceLabel")}
              </label>
              <input
                id="extraPhotoPrice"
                type="number"
                min={0}
                step={1}
                value={extraPhotoPrice}
                onChange={(e) => setExtraPhotoPrice(e.target.value)}
                disabled={savingSettings}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {t("proofGalleries.extraPhotoPriceHint", {
                  currency: gallery.currency,
                })}
              </p>
            </div>

            {settingsMessage ? (
              <p className="text-sm text-green-700">{settingsMessage}</p>
            ) : null}

            {settingsError ? (
              <p className="text-sm text-red-700">{settingsError}</p>
            ) : null}

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingSettings
                ? t("common.saving")
                : t("proofGalleries.saveSettings")}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
        <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-brand-green">
          {t("proofGalleries.clientMessageTitle")}
          {!permissions.canEditClientMessage ? (
            <LockIcon className="h-4 w-4 shrink-0 text-gray-400" />
          ) : null}
        </h2>

        {permissions.canEditClientMessage ? (
          <form onSubmit={handleSaveClientMessage} className="space-y-3">
            <label htmlFor="clientMessage" className="sr-only">
              {t("proofGalleries.clientMessageTitle")}
            </label>
            <textarea
              id="clientMessage"
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              disabled={savingClientMessage}
              rows={4}
              placeholder={t("proofGalleries.clientMessagePlaceholder")}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:bg-gray-100 disabled:text-gray-500"
            />

            {clientMessageSaved ? (
              <p className="text-sm text-green-700">{clientMessageSaved}</p>
            ) : null}

            {clientMessageError ? (
              <p className="text-sm text-red-700">{clientMessageError}</p>
            ) : null}

            <button
              type="submit"
              disabled={savingClientMessage}
              className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingClientMessage
                ? t("common.saving")
                : t("proofGalleries.saveClientMessage")}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {clientMessage ? (
              <p className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                {clientMessage}
              </p>
            ) : null}

            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <LockIcon className="h-3.5 w-3.5 shrink-0" />
              {t("proofGalleries.clientMessageLocked")}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-brand-green">
            {t("proofGalleries.photosTitle")} ({photos.length})
          </h2>

          {!permissions.canEditProofPhotos ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <LockIcon className="h-3.5 w-3.5 shrink-0" />
              {stage === "submitted"
                ? t("proofGalleries.photosLocked")
                : t("proofGalleries.photosLockedPaid")}
            </p>
          ) : (
            <label
              htmlFor="addPhotos"
              className="inline-flex cursor-pointer rounded-full border border-brand-gold/25 px-4 py-2 text-sm font-medium text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream"
            >
              {t("form.chooseAdditionalPhotos")}
              <input
                ref={photosInputRef}
                id="addPhotos"
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={handleAddPhotos}
                className="sr-only"
              />
            </label>
          )}
        </div>

        {uploadStatus ? (
          <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
            {uploadStatus}
          </p>
        ) : null}

        {uploadError ? (
          <p className="mb-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {uploadError}
          </p>
        ) : null}

        {photos.length === 0 ? (
          <p className="text-sm text-gray-600">
            {t("proofGalleries.noPhotosYet")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div
                  className={`relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-4 transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md ${
                    photo.selected ? "ring-brand-green" : "ring-transparent"
                  }`}
                >
                  <Image
                    src={photo.cardSrc}
                    alt={photo.fileName}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />

                  {photo.selected ? (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                      ✓
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {photo.fileName}
                </p>
                {!photo.selected && photo.rating ? (
                  <p
                    className={`mt-0.5 text-xs font-medium ${
                      photo.rating === "rather_yes"
                        ? "text-brand-gold-dark"
                        : "text-gray-500"
                    }`}
                  >
                    {photo.rating === "rather_yes"
                      ? t("proofGalleries.ratingRatherYes")
                      : t("proofGalleries.ratingRatherNo")}
                  </p>
                ) : null}
                {photo.comment ? (
                  <p className="mt-0.5 text-xs text-gray-700">
                    {photo.comment}
                  </p>
                ) : null}
                {permissions.canEditProofPhotos ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white"
                  >
                    {t("common.delete")}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
