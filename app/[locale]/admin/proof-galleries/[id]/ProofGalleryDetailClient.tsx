"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { uploadPhotoToCloudflare } from "@/app/utils/upload-photo-to-cloudflare";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { formatMoneyFromCents } from "@/app/lib/format-money";

type Gallery = {
  id: string;
  token: string;
  clientName: string;
  baseCostCents: number;
  freePhotoCount: number;
  extraPhotoPriceCents: number;
  currency: string;
  message: string | null;
};

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
  selected: boolean;
  comment: string | null;
};

type Order = {
  includedCount: number;
  extraCount: number;
  totalCents: number;
  submittedAtLabel: string;
  status: "pending_payment" | "paid";
  paidAtLabel: string | null;
} | null;

type Props = {
  locale: string;
  origin: string;
  gallery: Gallery;
  initialPhotos: Photo[];
  order: Order;
};

export default function ProofGalleryDetailClient({
  locale,
  origin,
  gallery,
  initialPhotos,
  order,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();

  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const [clientName, setClientName] = useState(gallery.clientName);
  const [baseCost, setBaseCost] = useState(
    String(gallery.baseCostCents / 100),
  );
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
  const [deletingGallery, setDeletingGallery] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [filenamesCopied, setFilenamesCopied] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paidError, setPaidError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);

  const selectedFileNames = photos
    .filter((photo) => photo.selected)
    .map((photo) => photo.fileName);

  const shareUrl = `${origin}/${locale}/proof/${gallery.token}`;

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

    try {
      const res = await fetch(`/api/admin/proof-galleries/${gallery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          baseCostCents: Math.round(baseCostUnits * 100),
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

  async function handleSaveClientMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setClientMessageError(null);
    setClientMessageSaved(null);
    setSavingClientMessage(true);

    try {
      const res = await fetch(`/api/admin/proof-galleries/${gallery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clientMessage }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || t("proofGalleries.clientMessageSaveFailed"),
        );
      }

      setClientMessageSaved(t("proofGalleries.clientMessageSaved"));
      router.refresh();
    } catch (err) {
      setClientMessageError(
        err instanceof Error ? err.message : t("common.genericError"),
      );
    } finally {
      setSavingClientMessage(false);
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
            selected: false,
            comment: null,
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
        err instanceof Error
          ? err.message
          : t("proofGalleries.deletePhotoFailed"),
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
        err instanceof Error
          ? err.message
          : t("proofGalleries.deleteGalleryFailed"),
      );
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleReopen() {
    const confirmed = await confirm({
      title: t("proofGalleries.reopenConfirmTitle"),
      message: t("proofGalleries.reopenConfirmMessage"),
      confirmLabel: t("proofGalleries.reopen"),
    });

    if (!confirmed) return;

    setReopening(true);
    setPaidError(null);

    try {
      const res = await fetch(
        `/api/admin/proof-galleries/${gallery.id}/reopen`,
        {
          method: "POST",
        },
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("proofGalleries.reopenFailed"));
      }

      router.refresh();
    } catch (err) {
      setPaidError(
        err instanceof Error ? err.message : t("proofGalleries.reopenFailed"),
      );
    } finally {
      setReopening(false);
    }
  }

  async function handleMarkPaid() {
    const confirmed = await confirm({
      title: t("proofGalleries.markPaidConfirmTitle"),
      message: t("proofGalleries.markPaidConfirmMessage"),
      confirmLabel: t("proofGalleries.markPaid"),
    });

    if (!confirmed) return;

    setMarkingPaid(true);
    setPaidError(null);

    try {
      const res = await fetch(
        `/api/admin/proof-galleries/${gallery.id}/mark-paid`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("proofGalleries.markPaidFailed"));
      }

      router.refresh();
    } catch (err) {
      setPaidError(
        err instanceof Error ? err.message : t("proofGalleries.markPaidFailed"),
      );
    } finally {
      setMarkingPaid(false);
    }
  }

  async function handleCopyFilenames() {
    await navigator.clipboard.writeText(selectedFileNames.join("\n"));
    setFilenamesCopied(true);
    setTimeout(() => setFilenamesCopied(false), 2000);
  }

  function handleDownloadFilenames() {
    const blob = new Blob([selectedFileNames.join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gallery.clientName}-selected-photos.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
            {linkCopied
              ? t("proofGalleries.linkCopied")
              : t("proofGalleries.copyLink")}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {t("proofGalleries.clientMessageTitle")}
        </h2>

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
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
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
            className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingClientMessage
              ? t("common.saving")
              : t("proofGalleries.saveClientMessage")}
          </button>
        </form>
      </section>

      {order ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("proofGalleries.orderTitle")}
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.status === "paid"
                  ? "bg-green-800 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.status === "paid"
                ? t("proofGalleries.statusPaid")
                : t("proofGalleries.orderPendingPayment")}
            </span>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">
                {t("proofGalleries.orderTotalSelected")}
              </dt>
              <dd className="font-medium text-gray-900">
                {order.includedCount + order.extraCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">
                {t("proofGalleries.orderIncluded")}
              </dt>
              <dd className="font-medium text-gray-900">
                {order.includedCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">
                {t("proofGalleries.orderExtra")}
              </dt>
              <dd className="font-medium text-gray-900">{order.extraCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">
                {t("proofGalleries.orderBaseCost")}
              </dt>
              <dd className="font-medium text-gray-900">
                {formatMoneyFromCents(gallery.baseCostCents, gallery.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <dt className="font-medium text-gray-900">
                {t("proofGalleries.orderTotal")}
              </dt>
              <dd className="font-semibold text-gray-900">
                {formatMoneyFromCents(order.totalCents, gallery.currency)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-gray-500">
            {t("proofGalleries.orderSubmittedAt", {
              date: order.submittedAtLabel,
            })}
          </p>

          {order.status === "paid" ? (
            <p className="mt-1 text-xs font-medium text-green-800">
              {t("proofGalleries.orderPaidAt", {
                date: order.paidAtLabel ?? "",
              })}
            </p>
          ) : (
            <div className="mt-4 flex flex-col items-end">
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={reopening || markingPaid}
                  className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-500 disabled:opacity-60"
                >
                  {reopening ? t("common.saving") : t("proofGalleries.reopen")}
                </button>
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={markingPaid || reopening}
                  className="rounded-full bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900 disabled:opacity-60"
                >
                  {markingPaid
                    ? t("common.saving")
                    : t("proofGalleries.markPaid")}
                </button>
              </div>
              {paidError ? (
                <p className="mt-2 text-sm text-red-700">{paidError}</p>
              ) : null}
            </div>
          )}

          {selectedFileNames.length > 0 ? (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                {t("proofGalleries.selectedFileNamesTitle")}
              </p>

              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-800">
                {selectedFileNames.join("\n")}
              </pre>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopyFilenames}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500"
                >
                  {filenamesCopied
                    ? t("proofGalleries.filenamesCopied")
                    : t("proofGalleries.copyFilenames")}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadFilenames}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500"
                >
                  {t("proofGalleries.downloadFilenames")}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {t("proofGalleries.settingsTitle")}
        </h2>

        {order ? (
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
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
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
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
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
              {savingSettings
                ? t("common.saving")
                : t("proofGalleries.saveSettings")}
            </button>
          </form>
        )}
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
                <div
                  className={`relative aspect-square overflow-hidden rounded-xl bg-gray-100 ring-4 ${
                    photo.selected ? "ring-green-700" : "ring-transparent"
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
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-800 text-xs font-bold text-white">
                      ✓
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {photo.fileName}
                </p>
                {photo.comment ? (
                  <p className="mt-0.5 text-xs text-gray-700">
                    {photo.comment}
                  </p>
                ) : null}
                {order ? null : (
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 pointer-coarse:opacity-100"
                  >
                    {t("common.delete")}
                  </button>
                )}
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
          {deletingGallery
            ? t("common.deleting")
            : t("proofGalleries.deleteGallery")}
        </button>
      </section>
    </div>
  );
}
