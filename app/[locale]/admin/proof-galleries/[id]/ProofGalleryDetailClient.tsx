"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { uploadPhotoToCloudflare } from "@/app/utils/upload-photo-to-cloudflare";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";

type Gallery = {
  id: string;
  token: string;
  clientName: string;
  freePhotoCount: number;
  extraPhotoPriceCents: number;
  currency: string;
};

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
};

type Props = {
  locale: string;
  gallery: Gallery;
  initialPhotos: Photo[];
};

export default function ProofGalleryDetailClient({
  locale,
  gallery,
  initialPhotos,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();

  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const [clientName, setClientName] = useState(gallery.clientName);
  const [freePhotoCount, setFreePhotoCount] = useState(
    String(gallery.freePhotoCount),
  );
  const [extraPhotoPrice, setExtraPhotoPrice] = useState(
    String(gallery.extraPhotoPriceCents / 100),
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingGallery, setDeletingGallery] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/proof/${gallery.token}`
      : `/${locale}/proof/${gallery.token}`;

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSettingsError(null);
    setSettingsMessage(null);

    const name = clientName.trim();
    const freeCount = Number(freePhotoCount);
    const priceUnits = Number(extraPhotoPrice);

    if (!name) {
      setSettingsError(t("proofGalleries.clientNameLabel"));
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

    try {
      const res = await fetch(`/api/admin/proof-galleries/${gallery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          freePhotoCount: Math.round(freeCount),
          extraPhotoPriceCents: Math.round(priceUnits * 100),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("proofGalleries.settingsSaveFailed"));
      }

      setSettingsMessage(t("proofGalleries.settingsSaved"));
      router.refresh();
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : t("common.genericError"),
      );
    } finally {
      setSavingSettings(false);
    }
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

      try {
        const { cloudflareId } = await uploadPhotoToCloudflare(file);

        const res = await fetch(
          `/api/admin/proof-galleries/${gallery.id}/photos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cloudflareId, fileName: file.name }),
          },
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || t("common.genericError"));
        }

        setPhotos((prev) => [
          ...prev,
          {
            id: data.photo.id as string,
            fileName: file.name,
            cardSrc: getCloudflareImageUrl(cloudflareId, "card"),
          },
        ]);
      } catch (err) {
        failures.push(
          `${file.name}: ${err instanceof Error ? err.message : t("common.genericError")}`,
        );
      }
    }

    setUploading(false);
    setUploadStatus(null);

    if (failures.length) {
      setUploadError(failures.join("\n"));
    }

    router.refresh();
  }

  async function handleDeletePhoto(photo: Photo) {
    const confirmed = await confirm({
      message: t("proofGalleries.deletePhotoConfirmMessage"),
      danger: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/proof-galleries/${gallery.id}/photos`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo.id }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("proofGalleries.deletePhotoFailed"));
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      router.refresh();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : t("proofGalleries.deletePhotoFailed"),
      );
    }
  }

  async function handleDeleteGallery() {
    const confirmed = await confirm({
      title: t("proofGalleries.deleteGalleryConfirmTitle"),
      message: t("proofGalleries.deleteGalleryConfirmMessage", {
        name: gallery.clientName,
      }),
      confirmLabel: t("proofGalleries.deleteGallery"),
      danger: true,
    });

    if (!confirmed) return;

    setDeletingGallery(true);

    try {
      const res = await fetch(`/api/admin/proof-galleries/${gallery.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("proofGalleries.deleteGalleryFailed"));
      }

      router.push(`/${locale}/admin/proof-galleries`);
      router.refresh();
    } catch (err) {
      setDeletingGallery(false);
      setUploadError(
        err instanceof Error ? err.message : t("proofGalleries.deleteGalleryFailed"),
      );
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-gray-700">
          {t("proofGalleries.shareableLink")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="break-all rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500"
          >
            {linkCopied ? t("proofGalleries.linkCopied") : t("proofGalleries.copyLink")}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {t("proofGalleries.settingsTitle")}
        </h2>

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
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
              required
            />
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
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
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
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
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
            className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingSettings ? t("common.saving") : t("proofGalleries.saveSettings")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("proofGalleries.photosTitle")}
          </h2>

          <label
            htmlFor="addPhotos"
            className="inline-flex cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500"
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
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={photo.cardSrc}
                    alt={photo.fileName}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {photo.fileName}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100"
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={handleDeleteGallery}
          disabled={deletingGallery}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:border-red-500 disabled:opacity-60"
        >
          {deletingGallery ? t("common.deleting") : t("proofGalleries.deleteGallery")}
        </button>
      </section>
    </div>
  );
}
