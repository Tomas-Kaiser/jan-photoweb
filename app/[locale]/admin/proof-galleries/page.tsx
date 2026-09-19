import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { proofGalleries, proofPhotos } from "@/app/db/schema";

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

  const galleries = await db
    .select({
      id: proofGalleries.id,
      clientName: proofGalleries.clientName,
      status: proofGalleries.status,
      createdAt: proofGalleries.createdAt,
      photoCount: sql<number>`count(${proofPhotos.id})`.mapWith(Number),
    })
    .from(proofGalleries)
    .leftJoin(proofPhotos, eq(proofPhotos.galleryId, proofGalleries.id))
    .groupBy(proofGalleries.id)
    .orderBy(desc(proofGalleries.createdAt));

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
        <div className="grid gap-4 sm:grid-cols-2">
          {galleries.map((gallery) => (
            <Link
              key={gallery.id}
              href={`/${locale}/admin/proof-galleries/${gallery.id}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {gallery.clientName}
                </h2>
                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {t(`proofGalleries.status${capitalize(gallery.status)}`)}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                {t("proofGalleries.photoCount", { count: gallery.photoCount })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
