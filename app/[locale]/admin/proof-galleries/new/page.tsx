import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/auth";
import NewProofGalleryForm from "./NewProofGalleryForm";

export default async function NewProofGalleryPage({
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/${locale}/admin/proof-galleries`}
        className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-800"
      >
        &larr; {t("proofGalleries.backToList")}
      </Link>

      <h1 className="mb-6 text-3xl font-bold">
        {t("proofGalleries.newGallery")}
      </h1>

      <NewProofGalleryForm locale={locale} />
    </div>
  );
}
