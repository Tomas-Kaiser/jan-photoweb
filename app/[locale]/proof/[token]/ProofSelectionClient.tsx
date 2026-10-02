"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import Reveal from "./Reveal";

type Rating = "rather_no" | "rather_yes" | null;

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
  detailSrc: string;
  comment: string | null;
  selected: boolean;
  rating: Rating;
};

type Props = {
  token: string;
  locale: string;
  baseCostCents: number;
  freePhotoCount: number;
  extraPhotoPriceCents: number;
  currency: string;
  photos: Photo[];
};

type Selection = {
  selected: boolean;
  comment: string;
  rating: Rating;
};

type Filter = "all" | "selected" | "rather_yes" | "rather_no";

export default function ProofSelectionClient({
  token,
  locale,
  baseCostCents,
  freePhotoCount,
  extraPhotoPriceCents,
  currency,
  photos,
}: Props) {
  const t = useTranslations("proof");
  const router = useRouter();
  const confirm = useConfirm();

  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    Object.fromEntries(
      photos.map((photo) => [
        photo.id,
        {
          selected: photo.selected,
          comment: photo.comment ?? "",
          rating: photo.rating,
        },
      ]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const summaryBarRef = useRef<HTMLDivElement>(null);
  const [showFloatingSummary, setShowFloatingSummary] = useState(false);
  const [floatingSummaryCollapsed, setFloatingSummaryCollapsed] =
    useState(false);

  useEffect(() => {
    const node = summaryBarRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) =>
        setShowFloatingSummary(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        ),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const slides = photos.map((photo) => ({ src: photo.detailSrc }));
  const lightboxPhoto =
    lightboxIndex !== null ? photos[lightboxIndex] : undefined;
  const lightboxSelected = lightboxPhoto
    ? (selections[lightboxPhoto.id]?.selected ?? false)
    : false;
  const lightboxRating = lightboxPhoto
    ? (selections[lightboxPhoto.id]?.rating ?? null)
    : null;

  const selectedCount = useMemo(
    () => Object.values(selections).filter((s) => s.selected).length,
    [selections],
  );

  const ratherYesCount = useMemo(
    () => Object.values(selections).filter((s) => s.rating === "rather_yes").length,
    [selections],
  );

  const ratherNoCount = useMemo(
    () => Object.values(selections).filter((s) => s.rating === "rather_no").length,
    [selections],
  );

  const visiblePhotos = useMemo(
    () =>
      photos
        .map((photo, index) => ({ photo, index }))
        .filter(({ photo }) => {
          if (filter === "all") return true;
          const selection = selections[photo.id];
          if (filter === "selected") return selection?.selected ?? false;
          return selection?.rating === filter;
        }),
    [photos, selections, filter],
  );

  const freeRemaining = Math.max(0, freePhotoCount - selectedCount);
  const extraCount = Math.max(0, selectedCount - freePhotoCount);
  const totalCents = baseCostCents + extraCount * extraPhotoPriceCents;

  function toggleSelected(photoId: string) {
    setSelections((prev) => {
      const current = prev[photoId];
      const nextSelected = !current.selected;
      return {
        ...prev,
        [photoId]: {
          ...current,
          selected: nextSelected,
          rating: nextSelected ? null : current.rating,
        },
      };
    });
  }

  function setRating(photoId: string, rating: "rather_no" | "rather_yes") {
    setSelections((prev) => {
      const current = prev[photoId];
      const nextRating = current.rating === rating ? null : rating;
      return {
        ...prev,
        [photoId]: {
          ...current,
          rating: nextRating,
          selected: nextRating ? false : current.selected,
        },
      };
    });
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
      brand: true,
    });

    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/proof/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          photos: photos.map((photo) => ({
            photoId: photo.id,
            selected: selections[photo.id]?.selected ?? false,
            comment: selections[photo.id]?.comment || null,
            rating: selections[photo.id]?.rating ?? null,
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
      <div ref={summaryBarRef}>
        <Reveal className="mt-10 rounded-3xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-base font-semibold text-brand-green">
                {t("selectedCount", { count: selectedCount })}
              </p>
              {freeRemaining > 0 || extraCount > 0 ? (
                <p className="mt-1 text-sm text-brand-green/70">
                  {freeRemaining > 0
                    ? t("freeRemainingCount", { count: freeRemaining })
                    : null}
                  {freeRemaining > 0 && extraCount > 0 ? " · " : null}
                  {extraCount > 0
                    ? t("extraBreakdown", {
                        count: extraCount,
                        price: formatMoneyFromCents(
                          extraPhotoPriceCents,
                          currency,
                        ),
                      })
                    : null}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-5">
              {totalCents > 0 ? (
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-gold-dark">
                    {t("totalLabel")}
                  </p>
                  <p
                    key={totalCents}
                    className="proof-tick text-2xl font-bold text-brand-green"
                  >
                    {formatMoneyFromCents(totalCents, currency)}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedCount === 0}
                className="rounded-full bg-brand-green px-7 py-3 motion-safe:active:scale-95 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t("submitting") : t("submitButton")}
              </button>
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </Reveal>
      </div>

      <div
        aria-hidden={!showFloatingSummary}
        className={`fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-stretch overflow-hidden rounded-l-3xl bg-white shadow-[0_10px_40px_-12px_rgba(1,68,33,0.25)] transition-all duration-300 lg:flex ${
          showFloatingSummary
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[120%] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setFloatingSummaryCollapsed((collapsed) => !collapsed)}
          aria-label={
            floatingSummaryCollapsed
              ? t("expandSummary")
              : t("collapseSummary")
          }
          aria-expanded={!floatingSummaryCollapsed}
          className="flex w-7 shrink-0 items-center justify-center self-stretch transition hover:bg-brand-cream"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 text-brand-green/60 transition-transform duration-300 ${
              floatingSummaryCollapsed ? "rotate-180" : ""
            }`}
          >
            <path
              d="M8.5 4l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            floatingSummaryCollapsed ? "w-0" : "w-60"
          }`}
        >
          <div className="flex w-60 flex-col gap-4 p-5">
            <div>
              <p className="text-sm font-semibold text-brand-green">
                {t("selectedCount", { count: selectedCount })}
              </p>
              {extraCount > 0 ? (
                <p className="mt-1 text-xs text-brand-green/70">
                  {t("extraBreakdown", {
                    count: extraCount,
                    price: formatMoneyFromCents(
                      extraPhotoPriceCents,
                      currency,
                    ),
                  })}
                </p>
              ) : null}
            </div>

            {totalCents > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-gold-dark">
                  {t("totalLabel")}
                </p>
                <p
                  key={totalCents}
                  className="proof-tick text-xl font-bold text-brand-green"
                >
                  {formatMoneyFromCents(totalCents, currency)}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0}
              className="w-full rounded-full bg-brand-green px-5 py-2.5 motion-safe:active:scale-95 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t("submitting") : t("submitButton")}
            </button>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!showFloatingSummary}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-brand-gold/15 bg-white px-4 pt-3 shadow-[0_-10px_30px_-15px_rgba(1,68,33,0.25)] transition-transform duration-300 lg:hidden ${
          showFloatingSummary
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-green">
            {t("selectedCount", { count: selectedCount })}
          </p>
          {freeRemaining > 0 || extraCount > 0 ? (
            <p className="text-xs text-brand-green/70">
              {freeRemaining > 0
                ? t("freeRemainingCount", { count: freeRemaining })
                : null}
              {freeRemaining > 0 && extraCount > 0 ? " · " : null}
              {extraCount > 0
                ? t("extraBreakdown", {
                    count: extraCount,
                    price: formatMoneyFromCents(
                      extraPhotoPriceCents,
                      currency,
                    ),
                  })
                : null}
            </p>
          ) : null}
          {totalCents > 0 ? (
            <p
              key={totalCents}
              className="proof-tick mt-0.5 text-base font-bold text-brand-green"
            >
              {formatMoneyFromCents(totalCents, currency)}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selectedCount === 0}
          className="shrink-0 rounded-full bg-brand-green px-5 py-2.5 motion-safe:active:scale-95 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submitButton")}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: t("filterAll"), count: photos.length },
            {
              key: "selected",
              label: t("filterSelected"),
              count: selectedCount,
            },
            {
              key: "rather_yes",
              label: t("filterRatherYes"),
              count: ratherYesCount,
            },
            {
              key: "rather_no",
              label: t("filterRatherNo"),
              count: ratherNoCount,
            },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            aria-pressed={filter === option.key}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              filter === option.key
                ? "border-transparent bg-brand-green text-white"
                : "border-brand-gold/20 bg-white text-brand-green hover:bg-brand-cream"
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {visiblePhotos.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">{t("filterNoMatches")}</p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-7 md:grid-cols-4">
        {visiblePhotos.map(({ photo, index }) => {
          const selection = selections[photo.id];

          return (
            <Reveal key={photo.id} delay={(index % 4) * 70}>
              <div
                className={`relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.25)] ring-2 ring-offset-2 ring-offset-brand-cream transition duration-200 motion-safe:hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.3)] ${
                  selection.selected
                    ? "ring-brand-green"
                    : "ring-transparent hover:ring-brand-green/30"
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

                <button
                  type="button"
                  key={selection.selected ? "selected" : "unselected"}
                  onClick={() => toggleSelected(photo.id)}
                  aria-label={selection.selected ? t("selected") : t("select")}
                  aria-pressed={selection.selected}
                  className={`proof-pop absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow transition motion-safe:active:scale-95 ${
                    selection.selected
                      ? "bg-brand-green text-white"
                      : "bg-white/70 text-transparent ring-1 ring-inset ring-white hover:bg-white"
                  }`}
                >
                  {selection.selected ? "✓" : ""}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-full border border-brand-gold/20 bg-white shadow-sm sm:inline-flex sm:w-auto">
                <button
                  type="button"
                  onClick={() => setRating(photo.id, "rather_no")}
                  aria-pressed={selection.rating === "rather_no"}
                  className={`min-w-0 px-2 py-1 text-xs font-semibold transition motion-safe:active:scale-95 sm:px-3 ${
                    selection.rating === "rather_no"
                      ? "bg-gray-500 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {t("ratherNo")}
                </button>
                <button
                  type="button"
                  onClick={() => setRating(photo.id, "rather_yes")}
                  aria-pressed={selection.rating === "rather_yes"}
                  className={`min-w-0 border-l border-brand-gold/20 px-2 py-1 text-xs font-semibold transition motion-safe:active:scale-95 sm:px-3 ${
                    selection.rating === "rather_yes"
                      ? "bg-brand-gold text-white"
                      : "text-brand-gold-dark hover:bg-brand-cream"
                  }`}
                >
                  {t("ratherYes")}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSelected(photo.id)}
                  aria-pressed={selection.selected}
                  className={`min-w-0 border-l border-brand-gold/20 px-2 py-1 text-xs font-semibold transition motion-safe:active:scale-95 sm:px-3 ${
                    selection.selected
                      ? "bg-brand-green text-white"
                      : "text-brand-green hover:bg-brand-cream"
                  }`}
                >
                  {selection.selected ? t("selected") : t("select")}
                </button>
              </div>

              <input
                type="text"
                value={selection.comment}
                onChange={(e) => setComment(photo.id, e.target.value)}
                placeholder={t("commentPlaceholder")}
                className="mt-3 w-full rounded-2xl border border-transparent bg-white/80 shadow-sm px-3.5 py-2 text-xs text-gray-800 outline-none transition focus:border-brand-green focus:ring-1 focus:ring-brand-green"
              />
            </Reveal>
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
                <div className="pointer-events-auto inline-flex overflow-hidden rounded-full border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
                  <button
                    type="button"
                    onClick={() => setRating(lightboxPhoto.id, "rather_no")}
                    className={`px-5 py-3 text-sm font-semibold transition ${
                      lightboxRating === "rather_no"
                        ? "bg-gray-500 text-white"
                        : "bg-white/80 text-gray-600 hover:bg-white"
                    }`}
                  >
                    {t("ratherNo")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRating(lightboxPhoto.id, "rather_yes")}
                    className={`border-l border-white/40 px-5 py-3 text-sm font-semibold transition ${
                      lightboxRating === "rather_yes"
                        ? "bg-brand-gold text-white"
                        : "bg-white/80 text-brand-gold-dark hover:bg-white"
                    }`}
                  >
                    {t("ratherYes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelected(lightboxPhoto.id)}
                    className={`border-l border-white/40 px-5 py-3 text-sm font-semibold transition ${
                      lightboxSelected
                        ? "bg-brand-green/70 text-white hover:bg-brand-green/85"
                        : "bg-white/80 text-brand-green hover:bg-white"
                    }`}
                  >
                    {lightboxSelected ? `✓ ${t("selected")}` : t("select")}
                  </button>
                </div>
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
