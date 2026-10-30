import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link, redirect } from "@/app/i18n/routing";
import { db } from "@/app/db";
import {
  finalPhotos,
  proofGalleries,
  proofOrders,
  proofPhotos,
} from "@/app/db/schema";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import { finalPhotoOrder } from "@/app/lib/final-photo-order";
import { formatPragueDateTime } from "@/app/lib/format-date-time";
import ProofGalleryDetailClient from "./ProofGalleryDetailClient";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProofGalleryDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("admin");

  const galleryRows = await db
    .select()
    .from(proofGalleries)
    .where(eq(proofGalleries.id, id))
    .limit(1);

  if (!galleryRows.length) {
    notFound();
  }

  const gallery = galleryRows[0];

  const photoRows = await db
    .select()
    .from(proofPhotos)
    .where(eq(proofPhotos.galleryId, id))
    .orderBy(asc(proofPhotos.sortOrder), asc(proofPhotos.createdAt));

  const photos = photoRows.map((photo) => ({
    id: photo.id,
    fileName: photo.fileName,
    cardSrc: getCloudflareImageUrl(photo.cloudflareId, "card"),
    selected: photo.selected,
    rating: photo.rating,
    comment: photo.comment,
  }));

  const orderRows = await db
    .select()
    .from(proofOrders)
    .where(eq(proofOrders.galleryId, id))
    .limit(1);

  const order = orderRows[0]
    ? {
        includedCount: orderRows[0].includedCount,
        extraCount: orderRows[0].extraCount,
        totalCents: orderRows[0].totalCents,
        submittedAtLabel: formatPragueDateTime(orderRows[0].submittedAt, locale),
        status: orderRows[0].status,
        paidAtLabel: orderRows[0].confirmedAt
          ? formatPragueDateTime(orderRows[0].confirmedAt, locale)
          : null,
      }
    : null;

  const finalPhotoRows = await db
    .select()
    .from(finalPhotos)
    .where(eq(finalPhotos.galleryId, id))
    .orderBy(...finalPhotoOrder);

  const finalsPublishedAtLabel = gallery.finalsPublishedAt
    ? formatPragueDateTime(gallery.finalsPublishedAt, locale)
    : null;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-brand-cream/30">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/admin/proof-galleries"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green/70 transition hover:text-brand-green"
        >
          &larr; {t("proofGalleries.backToList")}
        </Link>

        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold-dark">
          {gallery.skipProof
            ? t("proofGalleries.directDelivery")
            : t("proofGalleries.detailEyebrow")}
        </p>
        <h1 className="mb-8 mt-1 font-display text-4xl font-semibold text-brand-green">
          {gallery.clientName}
        </h1>

        <ProofGalleryDetailClient
          locale={locale}
          origin={origin}
          gallery={{
            id: gallery.id,
            token: gallery.token,
            clientName: gallery.clientName,
            baseCostCents: gallery.baseCostCents,
            freePhotoCount: gallery.freePhotoCount,
            extraPhotoPriceCents: gallery.extraPhotoPriceCents,
            currency: gallery.currency,
            message: gallery.message,
            skipProof: gallery.skipProof,
          }}
          initialPhotos={photos}
          order={order}
          initialFinalPhotos={finalPhotoRows}
          finalsPublishedAt={gallery.finalsPublishedAt?.toISOString() ?? null}
          finalsPublishedAtLabel={finalsPublishedAtLabel}
          initialEventDate={
            gallery.eventDate
              ? gallery.eventDate.toISOString().slice(0, 10)
              : ""
          }
          initialEventType={gallery.eventType}
          initialRequiresRegistration={gallery.requiresRegistration}
          initialFinalsMessage={gallery.finalsMessage ?? ""}
          initialHeroMobileCloudflareId={gallery.heroMobileCloudflareId}
          initialHeroDesktopCloudflareId={gallery.heroDesktopCloudflareId}
        />
      </div>
    </div>
  );
}
