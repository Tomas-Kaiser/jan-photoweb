"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { useToast } from "@/app/components/Toast";
import { uploadPhotoToCloudflare } from "@/app/utils/upload-photo-to-cloudflare";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { getDaysUntilFinalDeliveryDeletion } from "@/app/lib/final-delivery-retention";

type FinalPhoto = {
  id: string;
  fileName: string;
  sizeBytes: number;
  previewCloudflareId: string;
};

type Props = {
  galleryId: string;
  orderStatus: "pending_payment" | "paid";
  initialFinalPhotos: FinalPhoto[];
  finalsPublishedAtLabel: string | null;
  finalsPublishedAt: string | null;
};

type UploadStage = "idle" | "uploadingPreview" | "uploadingOriginal" | "saving";

type UploadFailure = {
  file: File;
  message: string;
};

export default function FinalPhotosSection({
  galleryId,
  orderStatus,
  initialFinalPhotos,
  finalsPublishedAtLabel,
  finalsPublishedAt,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState(initialFinalPhotos);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isPublished = Boolean(finalsPublishedAt);
  const deletionDaysLeft = finalsPublishedAt
    ? getDaysUntilFinalDeliveryDeletion(new Date(finalsPublishedAt))
    : null;

  function resetFileInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function getStatusText() {
    if (!saving) return null;

    const total = files.length;
    const position = Math.min(currentIndex + 1, total);

    if (stage === "uploadingPreview") {
      return t("finalDelivery.uploadingPreview", { position, total, name: currentFileName });
    }
    if (stage === "uploadingOriginal") {
      return t("finalDelivery.uploadingOriginal", { position, total, name: currentFileName });
    }
    if (stage === "saving") {
      return t("finalDelivery.savingPhoto", { position, total, name: currentFileName });
    }
    return t("upload.processing");
  }

  async function uploadOneFile(file: File): Promise<FinalPhoto> {
    setStage("uploadingPreview");
    const { cloudflareId: previewCloudflareId } = await uploadPhotoToCloudflare(file);

    setStage("uploadingOriginal");
    const urlRes = await fetch("/api/admin/final-photos/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });
    const urlData = await urlRes.json().catch(() => null);

    if (!urlRes.ok) {
      throw new Error(urlData?.error || t("finalDelivery.createUrlFailed"));
    }

    const { r2Key, uploadURL } = urlData;

    const putRes = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!putRes.ok) {
      throw new Error(t("finalDelivery.uploadOriginalFailed"));
    }

    setStage("saving");
    const saveRes = await fetch("/api/admin/final-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId,
        fileName: file.name,
        sizeBytes: file.size,
        r2Key,
        previewCloudflareId,
      }),
    });
    const saveData = await saveRes.json().catch(() => null);

    if (!saveRes.ok) {
      throw new Error(saveData?.error || t("finalDelivery.savePhotoFailed"));
    }

    return {
      id: saveData.photo.id as string,
      fileName: file.name,
      sizeBytes: file.size,
      previewCloudflareId,
    };
  }

  async function handleUpload(filesToUpload: File[]) {
    if (!filesToUpload.length) return;

    setSaving(true);
    setError(null);
    setFailures([]);
    setStage("idle");
    setCurrentIndex(0);

    const succeeded: FinalPhoto[] = [];
    const failed: UploadFailure[] = [];

    for (const [index, file] of filesToUpload.entries()) {
      setCurrentIndex(index);
      setCurrentFileName(file.name);

      try {
        const photo = await uploadOneFile(file);
        succeeded.push(photo);
      } catch (err) {
        failed.push({
          file,
          message: err instanceof Error ? err.message : t("common.genericError"),
        });
      }
    }

    setStage("idle");
    setCurrentFileName("");
    setSaving(false);

    if (succeeded.length) {
      setPhotos((prev) => [...prev, ...succeeded]);
      router.refresh();
    }

    if (!failed.length) {
      setFiles([]);
      resetFileInput();
      return;
    }

    setFiles(failed.map((f) => f.file));
    setFailures(failed);
    setError(
      succeeded.length
        ? t("form.photosPartialFailure", {
            succeeded: succeeded.length,
            total: filesToUpload.length,
            failed: failed.length,
          })
        : t("form.photosAllFailed", { failed: failed.length }),
    );
  }

  async function handleDeletePhoto(photo: FinalPhoto) {
    const confirmed = await confirm({
      message: t("finalDelivery.deletePhotoConfirmMessage"),
      danger: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/final-photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("finalDelivery.deletePhotoFailed"));
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      router.refresh();
    } catch (err) {
      toast.showError(
        err instanceof Error ? err.message : t("finalDelivery.deletePhotoFailed"),
      );
    }
  }

  async function handlePublish() {
    const confirmed = await confirm({
      title: t("finalDelivery.publishConfirmTitle"),
      message: t("finalDelivery.publishConfirmMessage"),
      confirmLabel: t("finalDelivery.publishButton"),
      brand: true,
    });
    if (!confirmed) return;

    setPublishing(true);
    setPublishError(null);

    try {
      const res = await fetch(
        `/api/admin/proof-galleries/${galleryId}/publish-finals`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("finalDelivery.publishFailed"));
      }

      router.refresh();
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : t("finalDelivery.publishFailed"),
      );
    } finally {
      setPublishing(false);
    }
  }

  const statusText = getStatusText();

  return (
    <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-brand-green">
          {t("finalDelivery.sectionTitle")}
        </h2>

        <label
          htmlFor="finalPhotos"
          className="inline-flex cursor-pointer rounded-full border border-brand-gold/25 px-4 py-2 text-sm font-medium text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream"
        >
          {t("finalDelivery.choosePhotos")}
          <input
            ref={inputRef}
            id="finalPhotos"
            type="file"
            accept="image/*"
            multiple
            disabled={saving}
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              setError(null);
              setFailures([]);
              setFiles(selected);
              if (selected.length) handleUpload(selected);
            }}
            className="sr-only"
          />
        </label>
      </div>

      <p className="mb-4 text-sm text-gray-500">{t("finalDelivery.uploadHint")}</p>

      {isPublished ? (
        <p className="mb-4 text-xs font-medium text-brand-green">
          {t("finalDelivery.publishedOnLabel", { date: finalsPublishedAtLabel ?? "" })}
          {deletionDaysLeft !== null ? (
            <span className="ml-2 font-semibold text-red-900">
              {t("proofGalleries.willBeDeletedIn", { days: deletionDaysLeft })}
            </span>
          ) : null}
          <span className="ml-2 text-green-700">
            {t("finalDelivery.addMoreHint")}
          </span>
        </p>
      ) : null}

      {failures.length > 0 ? (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleUpload(files)}
            disabled={saving}
            className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? t("common.uploading")
              : t("form.retryFailedPhotos", { count: failures.length })}
          </button>
        </div>
      ) : null}

      {statusText ? (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          {statusText}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
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

      {photos.length === 0 ? (
        <p className="text-sm text-gray-600">{t("finalDelivery.noFinalPhotosYet")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
                <Image
                  src={getCloudflareImageUrl(photo.previewCloudflareId, "card")}
                  alt={photo.fileName}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              <p className="mt-1 truncate text-xs text-gray-500">{photo.fileName}</p>

              {!isPublished ? (
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 pointer-coarse:opacity-100"
                >
                  {t("common.delete")}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!isPublished ? (
        <div className="mt-5 flex flex-col items-end border-t border-gray-100 pt-4">
          {orderStatus !== "paid" ? (
            <p className="mb-2 text-xs text-gray-500">
              {t("finalDelivery.needsPaidOrder")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || photos.length === 0 || orderStatus !== "paid"}
            className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? t("common.saving") : t("finalDelivery.publishButton")}
          </button>
          {publishError ? (
            <p className="mt-2 text-sm text-red-700">{publishError}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
