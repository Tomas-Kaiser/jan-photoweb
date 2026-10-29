import { getTranslations } from "next-intl/server";

// Shown for an unknown gallery token (see page.tsx).
export default async function ProofGalleryNotFound() {
  const t = await getTranslations("proof");

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
