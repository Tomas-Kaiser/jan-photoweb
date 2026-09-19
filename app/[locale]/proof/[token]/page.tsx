import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import ProofSelectionClient from "./ProofSelectionClient";

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
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 text-gray-600">{t("notFoundMessage")}</p>
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

  // Rendered with the "card" variant for now — a dedicated watermarked,
  // resolution-capped Cloudflare Images variant still needs to be set up
  // (docs/photo-proofing-design.md §7) before this goes live with real
  // clients, since "card" is full quality.
  const photos = photoRows.map((photo) => ({
    id: photo.id,
    fileName: photo.fileName,
    cardSrc: getCloudflareImageUrl(photo.cloudflareId, "card"),
    comment: photo.comment,
  }));

  if (order) {
    const selectedIds = new Set(order.selectedPhotoIds);
    const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));

    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("thankYouTitle")}
        </h1>
        <p className="mt-3 text-gray-600">{t("thankYouMessage")}</p>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("summaryIncluded")}</dt>
              <dd className="font-medium text-gray-900">
                {order.includedCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("summaryExtra")}</dt>
              <dd className="font-medium text-gray-900">
                {order.extraCount}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <dt className="font-medium text-gray-900">
                {t("summaryTotal")}
              </dt>
              <dd className="font-semibold text-gray-900">
                {formatMoneyFromCents(order.totalCents, gallery.currency)}
              </dd>
            </div>
          </dl>
        </div>

        {selectedPhotos.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {selectedPhotos.map((photo) => (
              <div key={photo.id}>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={photo.cardSrc}
                    alt={photo.fileName}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                {photo.comment ? (
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-medium">{t("yourNote")}:</span>{" "}
                    {photo.comment}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>
        <p className="mt-3 text-gray-600">{t("noPhotosYet")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">{t("heading")}</h1>
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
