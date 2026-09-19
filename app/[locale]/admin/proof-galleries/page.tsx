import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

export default async function ProofGalleriesAdminPage() {
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">
        {t("proofGalleries.pageTitle")}
      </h1>
      <p className="text-gray-600">{t("proofGalleries.comingSoon")}</p>
    </div>
  );
}
