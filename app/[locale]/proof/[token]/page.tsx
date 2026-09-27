import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";
import {
  getCloudflareImageUrl,
  getCloudflareImageUrlCapped,
} from "@/app/lib/cloudflare-images";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import ProofSelectionClient from "./ProofSelectionClient";
import ProofOrderPhotosClient from "./ProofOrderPhotosClient";
import Reveal from "./Reveal";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function ProofGalleryPage({ params }: Props) {
  const { token } = await params;
  const t = await getTranslations("proof");

  const galleryRows = await db
    .select()
    .from(proofGalleries)
    .where(eq(proofGalleries.token, token))
    .limit(1);

  if (!galleryRows.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="rounded-3xl bg-white p-10 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)]">
          <h1 className="font-display text-3xl font-semibold text-brand-green">
            {t("notFoundTitle")}
          </h1>
          <p className="mt-3 text-gray-600">{t("notFoundMessage")}</p>
        </div>
      </div>
    );
  }

  const gallery = galleryRows[0];

  const photoRows = await db
    .select()
    .from(proofPhotos)
    .where(eq(proofPhotos.galleryId, gallery.id))
    .orderBy(asc(proofPhotos.sortOrder), asc(proofPhotos.createdAt));

  const orderRows = await db
    .select()
    .from(proofOrders)
    .where(eq(proofOrders.galleryId, gallery.id))
    .limit(1);

  const order = orderRows[0];

  // Rendered with the "card" variant for thumbnails and a hard-capped
  // (max 3000x2000, never upscaled) flexible-variant resize for the
  // expanded/lightbox view — a dedicated watermarked Cloudflare Images
  // variant still needs to be set up (docs/photo-proofing-design.md §7)
  // before this goes live with real clients. Deliberately never requesting
  // "full" here even for the expanded view, per §7 — that's reserved for
  // admin-authenticated routes post-payment.
  const photos = photoRows.map((photo) => ({
    id: photo.id,
    fileName: photo.fileName,
    cardSrc: getCloudflareImageUrl(photo.cloudflareId, "card"),
    detailSrc: getCloudflareImageUrlCapped(photo.cloudflareId, 3000, 2000),
    comment: photo.comment,
    selected: photo.selected,
  }));

  if (order) {
    const selectedIds = new Set(order.selectedPhotoIds);
    const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));

    return (
      <div className="bg-brand-cream">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-20">
          <noscript>
            <style>
              {".reveal{opacity:1!important;transform:none!important}"}
            </style>
          </noscript>
          <Reveal
            as="p"
            className="text-sm font-medium uppercase tracking-wide text-brand-gold-dark"
          >
            {gallery.clientName}
          </Reveal>
          <Reveal
            as="h1"
            className="mt-3 font-display text-4xl font-semibold text-brand-green sm:text-5xl"
            delay={80}
          >
            {t("thankYouTitle")}
          </Reveal>
          <Reveal as="p" className="mt-4 text-gray-600" delay={160}>
            {t("thankYouMessage")}
          </Reveal>

          <Reveal
            className="mt-10 rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)] sm:p-7"
            delay={240}
          >
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">{t("summaryTotalSelected")}</dt>
                <dd className="font-medium text-brand-green">
                  {order.includedCount + order.extraCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">{t("summaryIncluded")}</dt>
                <dd className="font-medium text-brand-green">
                  {order.includedCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">{t("summaryExtra")}</dt>
                <dd className="font-medium text-brand-green">
                  {order.extraCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">{t("summaryBaseCost")}</dt>
                <dd className="font-medium text-brand-green">
                  {formatMoneyFromCents(gallery.baseCostCents, gallery.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-brand-gold/15 pt-3">
                <dt className="text-base font-semibold text-brand-green">
                  {t("summaryTotal")}
                </dt>
                <dd className="text-2xl font-bold text-brand-green">
                  {formatMoneyFromCents(order.totalCents, gallery.currency)}
                </dd>
              </div>
            </dl>
          </Reveal>

          {selectedPhotos.length > 0 ? (
            <>
              <Reveal
                as="h2"
                className="mt-14 font-display text-3xl font-semibold text-brand-green"
              >
                {t("selectedPhotosHeading")}
              </Reveal>
              <ProofOrderPhotosClient photos={selectedPhotos} />
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="rounded-3xl bg-white p-10 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)]">
          <h1 className="font-display text-3xl font-semibold text-brand-green">
            {t("heading")}
          </h1>
          <p className="mt-3 text-gray-600">{t("noPhotosYet")}</p>
        </div>
      </div>
    );
  }

  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <div className="bg-brand-cream">
      <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:py-20">
        <noscript>
          <style>
            {".reveal{opacity:1!important;transform:none!important}"}
          </style>
        </noscript>
        <Reveal as="header" className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold-dark">
            {gallery.clientName}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-green sm:text-6xl">
            {t("heading")}
          </h1>
          <div className="mt-7 h-px w-20 bg-brand-gold" />
          <p className="mt-5 text-lg leading-8 text-gray-600">
            {t("instructions")}
          </p>
        </Reveal>

        <Reveal className="mt-12 grid gap-5 sm:grid-cols-2" delay={100}>
          {gallery.baseCostCents > 0 ? (
            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold-dark">
                {t("baseCostLabel")}
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-green">
                {formatMoneyFromCents(gallery.baseCostCents, gallery.currency)}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold-dark">
              {t("packageLabel")}
            </p>
            <p className="mt-2 text-2xl font-bold text-brand-green">
              {t("packagePhotos", { count: gallery.freePhotoCount })}
            </p>
          </div>

          {gallery.extraPhotoPriceCents > 0 ? (
            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold-dark">
                {t("extraPriceLabel")}
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-green">
                {formatMoneyFromCents(
                  gallery.extraPhotoPriceCents,
                  gallery.currency,
                )}
                <span className="ml-1 text-sm font-medium text-gray-500">
                  {t("perPhoto")}
                </span>
              </p>
            </div>
          ) : null}
        </Reveal>

        <Reveal as="ol" className="mt-8 grid gap-3 sm:grid-cols-3" delay={100}>
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-3 text-sm text-gray-700"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </Reveal>

        <ProofSelectionClient
          token={token}
          baseCostCents={gallery.baseCostCents}
          freePhotoCount={gallery.freePhotoCount}
          extraPhotoPriceCents={gallery.extraPhotoPriceCents}
          currency={gallery.currency}
          photos={photos}
        />
      </div>
    </div>
  );
}
