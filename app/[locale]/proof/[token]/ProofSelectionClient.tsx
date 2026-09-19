"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { formatMoneyFromCents } from "@/app/lib/format-money";

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
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

  const selectedCount = useMemo(
    () => Object.values(selections).filter((s) => s.selected).length,
    [selections],
  );

  const includedCount = Math.min(selectedCount, freePhotoCount);
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
    <div className="pb-28">
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => {
          const selection = selections[photo.id];

          return (
            <div key={photo.id}>
              <button
                type="button"
                onClick={() => toggleSelected(photo.id)}
                className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-100 ring-2 transition ${
                  selection.selected ? "ring-black" : "ring-transparent"
                }`}
              >
                <Image
                  src={photo.cardSrc}
                  alt={photo.fileName}
                  fill
                  sizes="200px"
                  className="object-cover"
                />

                {selection.selected ? (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    ✓
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => toggleSelected(photo.id)}
                className="mt-1 text-xs font-medium text-gray-700"
              >
                {selection.selected ? t("selected") : t("select")}
              </button>

              <input
                type="text"
                value={selection.comment}
                onChange={(e) => setComment(photo.id, e.target.value)}
                placeholder={t("commentPlaceholder")}
                className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
              />
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[200] border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            <p className="font-medium">{t("selectedCount", { count: selectedCount })}</p>
            <p className="text-gray-500">
              {t("includedCount", { count: includedCount })}
              {extraCount > 0 ? (
                <>
                  {" · "}
                  {t("extraCount", { count: extraCount })}
                  {" · "}
                  {t("totalLabel")}:{" "}
                  <span className="font-medium text-gray-900">
                    {formatMoneyFromCents(totalCents, currency)}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? t("submitting") : t("submitButton")}
          </button>
        </div>

        {error ? (
          <p className="mx-auto mt-2 max-w-5xl text-sm text-red-700">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
