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
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
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
  }));

  if (order) {
    const selectedIds = new Set(order.selectedPhotoIds);
    const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));

    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-green-700">
          {gallery.clientName}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          {t("thankYouTitle")}
        </h1>
        <p className="mt-3 text-gray-600">{t("thankYouMessage")}</p>

        <div className="mt-8 rounded-3xl border border-green-100 bg-green-50/70 p-6 shadow-sm">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-green-800">{t("summaryTotalSelected")}</dt>
              <dd className="font-medium text-green-900">
                {order.includedCount + order.extraCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-green-800">{t("summaryIncluded")}</dt>
              <dd className="font-medium text-green-900">
                {order.includedCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-green-800">{t("summaryExtra")}</dt>
              <dd className="font-medium text-green-900">
                {order.extraCount}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-green-200 pt-3">
              <dt className="text-base font-semibold text-green-900">
                {t("summaryTotal")}
              </dt>
              <dd className="text-2xl font-bold text-green-900">
                {formatMoneyFromCents(order.totalCents, gallery.currency)}
              </dd>
            </div>
          </dl>
        </div>

        {selectedPhotos.length > 0 ? (
          <ProofOrderPhotosClient photos={selectedPhotos} />
        ) : null}
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>
          <p className="mt-3 text-gray-600">{t("noPhotosYet")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-green-700">
        {gallery.clientName}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
        {t("heading")}
      </h1>
      <p className="mt-2 text-gray-600">{t("instructions")}</p>

      <ProofSelectionClient
        token={token}
        freePhotoCount={gallery.freePhotoCount}
        extraPhotoPriceCents={gallery.extraPhotoPriceCents}
        currency={gallery.currency}
        photos={photos}
      />
    </div>
  );
}
