"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/routing";
import { updateProofGallery } from "@/app/utils/proof-gallery-admin-api";

type Props = {
  galleryId: string;
  initialRequiresRegistration: boolean;
};

// The owner registration gate on the finals — toggleable at every stage,
// so it sits outside the stage panels. Saves on change.
export default function RegistrationSection({
  galleryId,
  initialRequiresRegistration,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [requiresRegistration, setRequiresRegistration] = useState(
    initialRequiresRegistration,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: boolean) {
    setRequiresRegistration(next);
    setSaving(true);
    setError(null);
    setSaved(null);

    const result = await updateProofGallery(galleryId, {
      requiresRegistration: next,
    });

    setSaving(false);

    if (!result.ok) {
      setRequiresRegistration(!next);
      setError(
        result.error ?? t("proofGalleries.requiresRegistrationSaveFailed"),
      );
      return;
    }

    setSaved(t("proofGalleries.requiresRegistrationSaved"));
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={requiresRegistration}
          onChange={(e) => handleChange(e.target.checked)}
          disabled={saving}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
        />
        <span>
          <span className="block text-sm font-semibold text-gray-900">
            {t("proofGalleries.requiresRegistrationLabel")}
          </span>
          <span className="mt-1 block text-sm text-gray-500">
            {t("proofGalleries.requiresRegistrationHint")}
          </span>
        </span>
      </label>

      {saved ? <p className="mt-2 text-sm text-green-700">{saved}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
