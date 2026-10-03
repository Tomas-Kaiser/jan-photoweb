import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import { getDaysUntilFinalDeliveryDeletion } from "@/app/lib/final-delivery-retention";

type Gallery = {
  id: string;
  clientName: string;
  status: string;
  currency: string;
  createdAt: Date;
  orderStatus: "pending_payment" | "paid" | null;
  orderTotalCents: number | null;
  finalsPublishedAt: Date | null;
  photoCount: number;
};

export default async function ProofGalleriesAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin");

  const galleries: Gallery[] = await db
    .select({
      id: proofGalleries.id,
      clientName: proofGalleries.clientName,
      status: proofGalleries.status,
      currency: proofGalleries.currency,
      createdAt: proofGalleries.createdAt,
      orderStatus: proofOrders.status,
      orderTotalCents: proofOrders.totalCents,
      finalsPublishedAt: proofGalleries.finalsPublishedAt,
      photoCount: sql<number>`count(${proofPhotos.id})`.mapWith(Number),
    })
    .from(proofGalleries)
    .leftJoin(proofPhotos, eq(proofPhotos.galleryId, proofGalleries.id))
    .leftJoin(proofOrders, eq(proofOrders.galleryId, proofGalleries.id))
    .groupBy(proofGalleries.id, proofOrders.id)
    .orderBy(desc(proofGalleries.createdAt));

  // Grouped by where each gallery actually is in its lifecycle, rather than
  // the raw `status` column — "draft" and "active" both mean "no submission
  // yet" from this page's point of view, and "paid" splits further into
  // whether finals have been published.
  const draft = galleries.filter((g) => !g.orderStatus);
  const awaitingPayment = galleries.filter((g) => g.orderStatus === "pending_payment");
  const paid = galleries.filter(
    (g) => g.orderStatus === "paid" && !g.finalsPublishedAt,
  );
  const published = galleries.filter((g) => g.finalsPublishedAt);

  const sections = [
    { key: "draft", title: t("proofGalleries.statusDraft"), items: draft },
    {
      key: "awaitingPayment",
      title: t("proofGalleries.orderPendingPayment"),
      items: awaitingPayment,
    },
    { key: "paid", title: t("proofGalleries.statusPaid"), items: paid },
    {
      key: "published",
      title: t("proofGalleries.sectionPublished"),
      items: published,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t("proofGalleries.pageTitle")}</h1>
        <Link
          href={`/${locale}/admin/proof-galleries/new`}
          className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white"
        >
          {t("proofGalleries.newGallery")}
        </Link>
      </div>

      {galleries.length === 0 ? (
        <p className="text-gray-600">{t("proofGalleries.noGalleriesYet")}</p>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.key}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {section.title} ({section.items.length})
              </h2>
              {section.items.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.items.map((gallery) => (
                    <GalleryCard key={gallery.id} locale={locale} gallery={gallery} t={t} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">{t("proofGalleries.noneInSection")}</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryCard({
  locale,
  gallery,
  t,
}: {
  locale: string;
  gallery: Gallery;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <Link
      href={`/${locale}/admin/proof-galleries/${gallery.id}`}
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{gallery.clientName}</h2>
        {gallery.orderStatus === "paid" ? (
          <span className="shrink-0 rounded-full bg-green-800 px-3 py-1 text-xs font-semibold text-white">
            {t("proofGalleries.statusPaid")}
          </span>
        ) : gallery.orderStatus === "pending_payment" ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {t("proofGalleries.orderPendingPayment")}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {t(`proofGalleries.status${capitalize(gallery.status)}`)}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {t("proofGalleries.photoCount", { count: gallery.photoCount })}
        {gallery.orderTotalCents !== null ? (
          <>
            {" · "}
            <span className="font-medium text-gray-900">
              {formatMoneyFromCents(gallery.orderTotalCents, gallery.currency)}
            </span>
          </>
        ) : null}
      </p>

      {gallery.finalsPublishedAt ? (
        <p className="mt-2 text-xs font-semibold text-green-800">
          {t("finalDelivery.publishedBadge", {
            days: getDaysUntilFinalDeliveryDeletion(gallery.finalsPublishedAt),
          })}
        </p>
      ) : null}
    </Link>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
