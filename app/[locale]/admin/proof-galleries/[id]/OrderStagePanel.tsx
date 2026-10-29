"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/routing";
import { useConfirm } from "@/app/components/ConfirmDialog";
import {
  markProofOrderPaid,
  reopenProofGallery,
} from "@/app/utils/proof-gallery-admin-api";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import type {
  GalleryPermissions,
  GalleryStage,
} from "@/app/lib/gallery-lifecycle";
import { LockedNotice } from "./LockedNotice";
import type { Gallery, Order, ProofPhoto } from "./types";

type Props = {
  // The "submitted" and "paid" tabs show the same order; they differ only in
  // what's shown before the gallery reaches them and in the link onward.
  tab: "submitted" | "paid";
  gallery: Gallery;
  order: Order | null;
  photos: ProofPhoto[];
  stage: GalleryStage;
  permissions: GalleryPermissions;
  onGoToFinals: () => void;
};

export default function OrderStagePanel({
  tab,
  gallery,
  order,
  photos,
  stage,
  permissions,
  onGoToFinals,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();

  const [filenamesCopied, setFilenamesCopied] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paidError, setPaidError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);

  const selectedFileNames = photos
    .filter((photo) => photo.selected)
    .map((photo) => photo.fileName);

  async function handleReopen() {
    const confirmed = await confirm({
      title: t("proofGalleries.reopenConfirmTitle"),
      message: t("proofGalleries.reopenConfirmMessage"),
      confirmLabel: t("proofGalleries.reopen"),
    });

    if (!confirmed) return;

    setReopening(true);
    setPaidError(null);

    const result = await reopenProofGallery(gallery.id);

    setReopening(false);

    if (!result.ok) {
      setPaidError(result.error ?? t("proofGalleries.reopenFailed"));
      return;
    }

    router.refresh();
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

    const result = await markProofOrderPaid(gallery.id);

    setMarkingPaid(false);

    if (!result.ok) {
      setPaidError(result.error ?? t("proofGalleries.markPaidFailed"));
      return;
    }

    router.refresh();
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

  if (stage === "proof" || !order) {
    return <LockedNotice>{t("proofGalleries.notSubmittedYet")}</LockedNotice>;
  }

  if (tab === "paid" && stage === "submitted") {
    return <LockedNotice>{t("proofGalleries.notPaidYet")}</LockedNotice>;
  }

  const orderSection = (
    <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-brand-green">
          {t("proofGalleries.orderTitle")}
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            order.status === "paid"
              ? "bg-brand-green text-white"
              : "bg-brand-gold/15 text-brand-gold-dark"
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
          <dt className="text-gray-600">{t("proofGalleries.orderIncluded")}</dt>
          <dd className="font-medium text-gray-900">{order.includedCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">{t("proofGalleries.orderExtra")}</dt>
          <dd className="font-medium text-gray-900">{order.extraCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">{t("proofGalleries.orderBaseCost")}</dt>
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
        <p className="mt-1 text-xs font-medium text-brand-green">
          {t("proofGalleries.orderPaidAt", {
            date: order.paidAtLabel ?? "",
          })}
        </p>
      ) : null}

      {permissions.canReopen || permissions.canMarkPaid ? (
        <div className="mt-4 flex flex-col items-end">
          <div className="flex flex-wrap justify-end gap-3">
            {permissions.canReopen ? (
              <button
                type="button"
                onClick={handleReopen}
                disabled={reopening || markingPaid}
                className="rounded-full border border-brand-gold/25 px-5 py-2.5 text-sm font-semibold text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream disabled:opacity-60"
              >
                {reopening ? t("common.saving") : t("proofGalleries.reopen")}
              </button>
            ) : null}
            {permissions.canMarkPaid ? (
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={markingPaid || reopening}
                className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:opacity-60"
              >
                {markingPaid
                  ? t("common.saving")
                  : t("proofGalleries.markPaid")}
              </button>
            ) : null}
          </div>
          {paidError ? (
            <p className="mt-2 text-sm text-red-700">{paidError}</p>
          ) : null}
        </div>
      ) : null}

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
              className="rounded-full border border-brand-gold/25 px-4 py-2 text-sm font-medium text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream"
            >
              {filenamesCopied
                ? t("proofGalleries.filenamesCopied")
                : t("proofGalleries.copyFilenames")}
            </button>
            <button
              type="button"
              onClick={handleDownloadFilenames}
              className="rounded-full border border-brand-gold/25 px-4 py-2 text-sm font-medium text-brand-green transition hover:border-brand-gold/50 hover:bg-brand-cream"
            >
              {t("proofGalleries.downloadFilenames")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );

  if (tab === "submitted") return orderSection;

  return (
    <div className="space-y-6">
      {orderSection}
      <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
        <button
          type="button"
          onClick={onGoToFinals}
          className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90"
        >
          {t("proofGalleries.goToFinalDelivery")} &rarr;
        </button>
      </section>
    </div>
  );
}
