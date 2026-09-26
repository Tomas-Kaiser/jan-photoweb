"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { uploadPhotoToCloudflare } from "@/app/utils/upload-photo-to-cloudflare";

type Props = {
  locale: string;
};

type UploadFailure = {
  file: File;
  message: string;
};

export default function NewProofGalleryForm({ locale }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();

  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const [clientName, setClientName] = useState("");
  const [freePhotoCount, setFreePhotoCount] = useState("10");
  const [extraPhotoPrice, setExtraPhotoPrice] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);

  // Set once the gallery itself is created, so a retry after a partial
  // photo-upload failure re-attempts only the failed photos.
  const [createdGalleryId, setCreatedGalleryId] = useState<string | null>(
    null,
  );

  async function uploadOnePhoto(galleryId: string, file: File) {
    const { cloudflareId } = await uploadPhotoToCloudflare(file);

    const res = await fetch(
      `/api/admin/proof-galleries/${galleryId}/photos`,
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
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setFailures([]);

    let galleryId = createdGalleryId;

    if (!galleryId) {
      const name = clientName.trim();
      const freeCount = Number(freePhotoCount);
      const priceUnits = Number(extraPhotoPrice);

      if (!name) {
        setError(t("proofGalleries.clientNameLabel"));
        return;
      }

      if (!Number.isFinite(freeCount) || freeCount < 0) {
        setError(t("proofGalleries.freePhotoCountLabel"));
        return;
      }

      if (!Number.isFinite(priceUnits) || priceUnits < 0) {
        setError(t("proofGalleries.extraPhotoPriceLabel"));
        return;
      }

      setSaving(true);
      setStatusText(t("proofGalleries.createGallery"));

      try {
        const res = await fetch("/api/admin/proof-galleries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: name,
            freePhotoCount: Math.round(freeCount),
            extraPhotoPriceCents: Math.round(priceUnits * 100),
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || t("proofGalleries.createFailed"));
        }

        galleryId = data.gallery.id as string;
        setCreatedGalleryId(galleryId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("common.genericError"),
        );
        setSaving(false);
        setStatusText(null);
        return;
      }
    } else {
      setSaving(true);
    }

    const succeeded: File[] = [];
    const failed: UploadFailure[] = [];

    for (const file of photoFiles) {
      setStatusText(
        t("upload.uploadingPhoto", {
          position: succeeded.length + failed.length + 1,
          total: photoFiles.length,
          name: file.name,
        }),
      );

      try {
        await uploadOnePhoto(galleryId, file);
        succeeded.push(file);
      } catch (err) {
        failed.push({
          file,
          message: err instanceof Error ? err.message : t("common.genericError"),
        });
      }
    }

    setSaving(false);
    setStatusText(null);

    if (!failed.length) {
      router.refresh();
      router.push(`/${locale}/admin/proof-galleries/${galleryId}`);
      return;
    }

    setPhotoFiles(failed.map((f) => f.file));
    setFailures(failed);
    setError(
      t("form.photosPartialFailure", {
        succeeded: succeeded.length,
        total: photoFiles.length,
        failed: failed.length,
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          disabled={saving || !!createdGalleryId}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder={t("proofGalleries.clientNamePlaceholder")}
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
          disabled={saving || !!createdGalleryId}
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
          disabled={saving || !!createdGalleryId}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          {t("proofGalleries.extraPhotoPriceHint", { currency: "CZK" })}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t("form.additionalPhotosLabel")}
        </label>

        <label
          htmlFor="photoFiles"
          className="group block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-white p-5 transition hover:border-gray-500 hover:bg-gray-50 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-200"
        >
          <input
            ref={photosInputRef}
            id="photoFiles"
            type="file"
            accept="image/*"
            multiple
            disabled={saving}
            onChange={(e) => {
              setPhotoFiles(Array.from(e.target.files ?? []));
              setError(null);
              setFailures([]);
            }}
            className="sr-only"
          />

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-lg text-gray-700">
              ⬆️
            </div>

            <div className="min-w-0 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {photoFiles.length > 0
                  ? t("form.changeSelectedPhotos")
                  : t("form.chooseAdditionalPhotos")}
              </div>

              <div className="mt-1 text-sm text-gray-600">
                {t("form.additionalPhotosHint")}
              </div>

              <div className="mt-2 text-sm text-gray-500">
                {photoFiles.length > 0
                  ? t("form.filesSelected", { count: photoFiles.length })
                  : t("form.multipleFilesHint")}
              </div>
            </div>
          </div>
        </label>
      </div>

      {statusText ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          {statusText}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <p>{error}</p>
          {failures.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {failures.map((failure) => (
                <li key={`${failure.file.name}-${failure.file.size}`}>
                  <span className="font-medium">{failure.file.name}</span>:{" "}
                  {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving
          ? t("common.saving")
          : failures.length > 0
            ? t("form.retryFailedPhotos", { count: failures.length })
            : t("proofGalleries.createGallery")}
      </button>
    </form>
  );
}
