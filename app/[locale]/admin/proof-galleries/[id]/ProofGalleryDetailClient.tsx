"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/routing";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { deleteProofGallery } from "@/app/utils/proof-gallery-admin-api";
import {
  getGalleryPermissions,
  getGalleryStage,
  type GalleryStage,
} from "@/app/lib/gallery-lifecycle";
import {
  PROOF_LINK_SEGMENTS,
  getProofLinkPath,
  type ProofLinkLocale,
} from "@/app/lib/proof-link";
import type { GalleryEventType } from "@/app/lib/gallery-event-type";
import EventTypeSection from "./EventTypeSection";
import RegistrationSection from "./RegistrationSection";
import FinalsStagePanel from "./FinalsStagePanel";
import OrderStagePanel from "./OrderStagePanel";
import ProofStagePanel from "./ProofStagePanel";
import type { FinalPhoto, Gallery, Order, ProofPhoto } from "./types";

type Props = {
  locale: string;
  origin: string;
  gallery: Gallery;
  initialPhotos: ProofPhoto[];
  order: Order | null;
  initialFinalPhotos: FinalPhoto[];
  finalsPublishedAt: string | null;
  finalsPublishedAtLabel: string | null;
  initialEventDate: string;
  initialEventType: GalleryEventType | null;
  initialRequiresRegistration: boolean;
  initialFinalsMessage: string;
  initialHeroMobileCloudflareId: string | null;
  initialHeroDesktopCloudflareId: string | null;
};

// The gallery's lifecycle, left to right. Each stage is a tab: clicking one
// only changes which panel is shown (selectedTab) — it never changes the
// gallery's actual progress, which comes from the lifecycle module
// (currentStageKey) and drives the circles' done/current/todo state
// independently of whatever tab is currently being viewed.
const STAGE_KEYS = [
  "proof",
  "submitted",
  "paid",
  "final",
  "delivered",
] as const;
type StageKey = (typeof STAGE_KEYS)[number];

// Direct delivery galleries (skipProof) have no proof/submission/payment,
// so their stepper only covers the final delivery itself.
const DIRECT_DELIVERY_STAGE_KEYS: readonly StageKey[] = ["final", "delivered"];

// "paid" never lingers as the current stage on its own — the moment it's
// paid, final delivery is the actionable next step, so progress sits on
// "final" until finals are published.
const STAGE_KEY_BY_STAGE: Record<GalleryStage, StageKey> = {
  proof: "proof",
  submitted: "submitted",
  awaitingFinals: "final",
  delivered: "delivered",
};

export default function ProofGalleryDetailClient({
  locale,
  origin,
  gallery,
  initialPhotos,
  order,
  initialFinalPhotos,
  finalsPublishedAt,
  finalsPublishedAtLabel,
  initialEventDate,
  initialEventType,
  initialRequiresRegistration,
  initialFinalsMessage,
  initialHeroMobileCloudflareId,
  initialHeroDesktopCloudflareId,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();

  const [deletingGallery, setDeletingGallery] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkLocale, setLinkLocale] = useState<ProofLinkLocale>(
    locale === "cs" ? "cs" : "en",
  );

  const lifecycle = {
    skipProof: gallery.skipProof,
    finalsPublishedAt,
    order,
  };
  const stage = getGalleryStage(lifecycle);
  const permissions = getGalleryPermissions(lifecycle);

  const shareUrl = `${origin}${getProofLinkPath(linkLocale, gallery.token)}`;

  const stageKeys = gallery.skipProof ? DIRECT_DELIVERY_STAGE_KEYS : STAGE_KEYS;
  const currentStageKey = STAGE_KEY_BY_STAGE[stage];
  const currentStageIndex = stageKeys.indexOf(currentStageKey);
  const isFinished = currentStageKey === "delivered";
  // The connector line runs between the first and last circle's centers —
  // each stage is an equal-width column, so that's half a column in from
  // either edge.
  const stageInsetPercent = 50 / stageKeys.length;
  const stageSpanPercent = 100 - 2 * stageInsetPercent;

  const [selectedTab, setSelectedTab] = useState<StageKey>(currentStageKey);

  // Jump the viewed tab forward when the gallery's real progress advances
  // (e.g. right after marking paid or publishing finals), while still
  // letting the admin click back to any other tab afterwards.
  useEffect(() => {
    setSelectedTab(currentStageKey);
  }, [currentStageKey]);

  const stageLabels: Record<StageKey, string> = {
    proof: t("proofGalleries.stageProof"),
    submitted: t("proofGalleries.stageSubmitted"),
    paid: t("proofGalleries.stagePaid"),
    final: t("proofGalleries.stageFinal"),
    delivered: t("proofGalleries.stageDelivered"),
  };

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
    setDeleteError(null);

    const result = await deleteProofGallery(gallery.id);

    if (!result.ok) {
      setDeletingGallery(false);
      setDeleteError(result.error ?? t("proofGalleries.deleteGalleryFailed"));
      return;
    }

    router.push("/admin/proof-galleries");
    router.refresh();
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
        <p className="mb-2 text-sm font-medium text-gray-700">
          {t("proofGalleries.shareableLink")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label={t("proofGalleries.linkLanguage")}
            className="flex rounded-full border border-brand-gold/25 p-0.5 text-sm"
          >
            {(Object.keys(PROOF_LINK_SEGMENTS) as ProofLinkLocale[]).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={linkLocale === option}
                  onClick={() => {
                    setLinkLocale(option);
                    setLinkCopied(false);
                  }}
                  className={`rounded-full px-3 py-1.5 font-medium uppercase transition ${
                    linkLocale === option
                      ? "bg-brand-green text-white"
                      : "text-brand-green hover:bg-brand-cream"
                  }`}
                >
                  {option}
                </button>
              ),
            )}
          </div>
          <code className="break-all rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-full border border-brand-gold/25 px-4 py-2 text-sm font-medium text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream"
          >
            {linkCopied
              ? t("proofGalleries.linkCopied")
              : t("proofGalleries.copyLink")}
          </button>
        </div>
      </section>

      <EventTypeSection
        galleryId={gallery.id}
        initialEventType={initialEventType}
      />

      <RegistrationSection
        galleryId={gallery.id}
        initialRequiresRegistration={initialRequiresRegistration}
      />

      <section className="rounded-3xl border border-brand-gold/15 bg-white p-7 pb-5 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)]">
        <div className="relative flex justify-between px-1">
          <div
            className="absolute top-[19px] h-0.5 bg-brand-gold/15"
            style={{
              left: `${stageInsetPercent}%`,
              right: `${stageInsetPercent}%`,
            }}
          />
          <div
            className="absolute top-[19px] h-0.5 bg-brand-green transition-[width] duration-300"
            style={{
              left: `${stageInsetPercent}%`,
              width: `${(currentStageIndex / (stageKeys.length - 1)) * stageSpanPercent}%`,
            }}
          />

          {stageKeys.map((key, index) => {
            // "delivered" is terminal — reaching it means it's complete,
            // not an in-progress step, so it gets the checkmark too.
            const isDone =
              index < currentStageIndex || (isFinished && index === currentStageIndex);
            const isCurrent = index === currentStageIndex && !isFinished;
            const isTodo = index > currentStageIndex;
            const isSelected = key === selectedTab;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTab(key)}
                className="relative z-10 flex flex-1 cursor-pointer flex-col items-center gap-2.5 pb-1"
              >
                {isDone ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-green bg-brand-green text-base font-bold text-white">
                    &#10003;
                  </span>
                ) : isCurrent ? (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-green bg-white text-sm font-bold text-brand-green ring-4 ring-brand-green/15">
                    {index + 1}
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-gold/20 bg-white text-sm font-semibold text-gray-400">
                    {index + 1}
                  </span>
                )}

                <span
                  className={`max-w-[120px] rounded-lg px-2.5 py-1 text-center text-xs ${
                    isSelected
                      ? "bg-brand-green/10 font-semibold text-brand-green"
                      : isTodo
                        ? "font-medium text-gray-400"
                        : "font-semibold text-brand-green"
                  }`}
                >
                  {stageLabels[key]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Every panel the stepper can reach stays mounted and is hidden when
          its tab isn't selected, so unsaved edits and in-flight uploads
          survive switching tabs. Direct delivery galleries have no proof or
          order stage. */}
      {!gallery.skipProof ? (
        <div hidden={selectedTab !== "proof"}>
          <ProofStagePanel
            gallery={gallery}
            initialPhotos={initialPhotos}
            stage={stage}
            permissions={permissions}
          />
        </div>
      ) : null}

      {!gallery.skipProof ? (
        <div hidden={selectedTab !== "submitted" && selectedTab !== "paid"}>
          <OrderStagePanel
            tab={selectedTab === "paid" ? "paid" : "submitted"}
            gallery={gallery}
            order={order}
            photos={initialPhotos}
            stage={stage}
            permissions={permissions}
            onGoToFinals={() => setSelectedTab("final")}
          />
        </div>
      ) : null}

      <div hidden={selectedTab !== "final" && selectedTab !== "delivered"}>
        <FinalsStagePanel
          galleryId={gallery.id}
          permissions={permissions}
          initialFinalPhotos={initialFinalPhotos}
          finalsPublishedAt={finalsPublishedAt}
          finalsPublishedAtLabel={finalsPublishedAtLabel}
          initialEventDate={initialEventDate}
          initialFinalsMessage={initialFinalsMessage}
          initialHeroMobileCloudflareId={initialHeroMobileCloudflareId}
          initialHeroDesktopCloudflareId={initialHeroDesktopCloudflareId}
        />
      </div>

      <section>
        <button
          type="button"
          onClick={handleDeleteGallery}
          disabled={deletingGallery}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:opacity-60"
        >
          {deletingGallery
            ? t("common.deleting")
            : t("proofGalleries.deleteGallery")}
        </button>
        {deleteError ? (
          <p className="mt-2 text-sm text-red-700">{deleteError}</p>
        ) : null}
      </section>
    </div>
  );
}
