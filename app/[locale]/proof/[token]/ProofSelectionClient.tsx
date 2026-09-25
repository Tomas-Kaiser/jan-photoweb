"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { formatMoneyFromCents } from "@/app/lib/format-money";

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
  detailSrc: string;
  comment: string | null;
};

type Props = {
  token: string;
  freePhotoCount: number;
  extraPhotoPriceCents: number;
  currency: string;
  photos: Photo[];
};

type Selection = {
  selected: boolean;
  comment: string;
};

export default function ProofSelectionClient({
  token,
  freePhotoCount,
  extraPhotoPriceCents,
  currency,
  photos,
}: Props) {
  const t = useTranslations("proof");
  const router = useRouter();
  const confirm = useConfirm();

  const [selections, setSelections] = useState<Record<string, Selection>>(
    () =>
      Object.fromEntries(
        photos.map((photo) => [
          photo.id,
          { selected: false, comment: photo.comment ?? "" },
        ]),
      ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const slides = photos.map((photo) => ({ src: photo.detailSrc }));
  const lightboxPhoto =
    lightboxIndex !== null ? photos[lightboxIndex] : undefined;
  const lightboxSelected = lightboxPhoto
    ? (selections[lightboxPhoto.id]?.selected ?? false)
    : false;

  const selectedCount = useMemo(
    () => Object.values(selections).filter((s) => s.selected).length,
    [selections],
  );

  const freeRemaining = Math.max(0, freePhotoCount - selectedCount);
  const extraCount = Math.max(0, selectedCount - freePhotoCount);
  const totalCents = extraCount * extraPhotoPriceCents;

  function toggleSelected(photoId: string) {
    setSelections((prev) => ({
      ...prev,
      [photoId]: { ...prev[photoId], selected: !prev[photoId].selected },
    }));
  }

  function setComment(photoId: string, comment: string) {
    setSelections((prev) => ({
      ...prev,
      [photoId]: { ...prev[photoId], comment },
    }));
  }

  async function handleSubmit() {
    const confirmed = await confirm({
      title: t("submitConfirmTitle"),
      message: t("submitConfirmMessage"),
      confirmLabel: t("submitButton"),
    });

    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/proof/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: photos.map((photo) => ({
            photoId: photo.id,
            selected: selections[photo.id]?.selected ?? false,
            comment: selections[photo.id]?.comment || null,
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("submitFailed"));
      }

      router.refresh();
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : t("submitFailed"));
    }
  }

  return (
    <div>
      <div className="mt-8 rounded-3xl border border-green-100 bg-green-50/70 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-base font-semibold text-green-900">
              {t("selectedCount", { count: selectedCount })}
            </p>
            <p className="mt-1 text-sm text-green-800">
              {t("freeRemainingCount", { count: freeRemaining })}
              {extraCount > 0 ? (
                <>
                  {" · "}
                  {t("extraBreakdown", {
                    count: extraCount,
                    price: formatMoneyFromCents(extraPhotoPriceCents, currency),
                  })}
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-5">
            {extraCount > 0 ? (
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                  {t("totalLabel")}
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatMoneyFromCents(totalCents, currency)}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0}
              className="rounded-full bg-green-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t("submitting") : t("submitButton")}
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => {
          const selection = selections[photo.id];

          return (
            <div key={photo.id}>
              <div
                className={`relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-4 transition duration-200 hover:shadow-md ${
                  selection.selected
                    ? "ring-green-700"
                    : "ring-transparent hover:ring-green-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={t("expand")}
                  className="absolute inset-0"
                >
                  <Image
                    src={photo.cardSrc}
                    alt={photo.fileName}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </button>

                {selection.selected ? (
                  <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white shadow">
                    ✓
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => toggleSelected(photo.id)}
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selection.selected
                    ? "bg-green-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {selection.selected ? t("selected") : t("select")}
              </button>

              <input
                type="text"
                value={selection.comment}
                onChange={(e) => setComment(photo.id, e.target.value)}
                placeholder={t("commentPlaceholder")}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
              />
            </div>
          );
        })}
      </div>

      <Lightbox
        open={lightboxIndex !== null}
        close={() => setLightboxIndex(null)}
        slides={slides}
        index={lightboxIndex ?? 0}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
        render={{
          controls: () =>
            lightboxPhoto ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => toggleSelected(lightboxPhoto.id)}
                  className={`pointer-events-auto rounded-full border px-8 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150 transition ${
                    lightboxSelected
                      ? "border-green-300/50 bg-green-700/60 hover:bg-green-700/75"
                      : "border-white/40 bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {lightboxSelected ? `✓ ${t("selected")}` : t("select")}
                </button>
              </div>
            ) : null,
        }}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          keyboardMoveDistance: 50,
        }}
      />
    </div>
  );
}
