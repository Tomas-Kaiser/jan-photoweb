import { desc, eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link, redirect } from "@/app/i18n/routing";
import { db } from "@/app/db";
import { proofGalleries, proofOrders, proofPhotos } from "@/app/db/schema";
import { formatMoneyFromCents } from "@/app/lib/format-money";
import { getDaysUntilFinalDeliveryDeletion } from "@/app/lib/final-delivery-retention";
import { getGalleryStage, type GalleryStage } from "@/app/lib/gallery-lifecycle";

type Gallery = {
  id: string;
  clientName: string;
  currency: string;
  createdAt: Date;
  orderStatus: "pending_payment" | "paid" | null;
  orderTotalCents: number | null;
  finalsPublishedAt: Date | null;
  skipProof: boolean;
  photoCount: number;
};

type Translator = Awaited<ReturnType<typeof getTranslations>>;

const STAGE_ORDER: GalleryStage[] = [
  "proof",
  "submitted",
  "awaitingFinals",
  "delivered",
];

// Shared by the section headings and each card's badge, so a gallery's
// badge always names the section it's listed under.
function stageLabel(stage: GalleryStage, t: Translator) {
  switch (stage) {
    case "proof":
      return t("proofGalleries.statusDraft");
    case "submitted":
      return t("proofGalleries.orderPendingPayment");
    case "awaitingFinals":
      return t("proofGalleries.stageFinal");
    case "delivered":
      return t("proofGalleries.sectionPublished");
  }
}

function getStage(gallery: Gallery) {
  return getGalleryStage({
    skipProof: gallery.skipProof,
    finalsPublishedAt: gallery.finalsPublishedAt,
    order: gallery.orderStatus ? { status: gallery.orderStatus } : null,
  });
}

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
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("admin");

  const galleries: Gallery[] = await db
    .select({
      id: proofGalleries.id,
      clientName: proofGalleries.clientName,
      currency: proofGalleries.currency,
      createdAt: proofGalleries.createdAt,
      orderStatus: proofOrders.status,
      orderTotalCents: proofOrders.totalCents,
      finalsPublishedAt: proofGalleries.finalsPublishedAt,
      skipProof: proofGalleries.skipProof,
      photoCount: sql<number>`count(${proofPhotos.id})`.mapWith(Number),
    })
    .from(proofGalleries)
    .leftJoin(proofPhotos, eq(proofPhotos.galleryId, proofGalleries.id))
    .leftJoin(proofOrders, eq(proofOrders.galleryId, proofGalleries.id))
    .groupBy(proofGalleries.id, proofOrders.id)
    .orderBy(desc(proofGalleries.createdAt));

  // Grouped by lifecycle stage. Direct delivery galleries never get an
  // order, so they sit alongside paid ones until published.
  const sections = STAGE_ORDER.map((stage) => ({
    key: stage,
    title: stageLabel(stage, t),
    items: galleries.filter((g) => getStage(g) === stage),
  }));

  return (
    <div className="min-h-screen bg-brand-cream/30">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold text-brand-green">
            {t("proofGalleries.pageTitle")}
          </h1>
          <Link
            href="/admin/proof-galleries/new"
            className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90"
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
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold-dark">
                  {section.title} ({section.items.length})
                </h2>
                {section.items.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.items.map((gallery) => (
                      <GalleryCard key={gallery.id} gallery={gallery} t={t} />
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
    </div>
  );
}

function GalleryCard({
  gallery,
  t,
}: {
  gallery: Gallery;
  t: Translator;
}) {
  const stage = getStage(gallery);

  return (
    <Link
      href={`/admin/proof-galleries/${gallery.id}`}
      className="group rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] transition duration-200 motion-safe:hover:-translate-y-0.5 hover:border-brand-gold/30 hover:shadow-[0_15px_45px_-20px_rgba(1,68,33,0.4)] sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-brand-green">
          {gallery.clientName}
        </h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${
            stage === "proof"
              ? "bg-gray-100 font-medium text-gray-700"
              : stage === "submitted"
                ? "bg-brand-gold/15 font-semibold text-brand-gold-dark"
                : "bg-brand-green font-semibold text-white"
          }`}
        >
          {stageLabel(stage, t)}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {gallery.skipProof
          ? t("proofGalleries.directDeliveryHint")
          : t("proofGalleries.photoCount", { count: gallery.photoCount })}
        {gallery.orderTotalCents !== null ? (
          <>
            {" · "}
            <span className="font-medium text-gray-900">
              {formatMoneyFromCents(gallery.orderTotalCents, gallery.currency)}
            </span>
          </>
        ) : null}
      </p>

      {stage === "delivered" && gallery.finalsPublishedAt ? (
        <p className="mt-2 text-xs font-semibold text-brand-green">
          {t("finalDelivery.publishedBadge", {
            days: getDaysUntilFinalDeliveryDeletion(gallery.finalsPublishedAt),
          })}
        </p>
      ) : null}
    </Link>
  );
}
