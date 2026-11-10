"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/app/i18n/routing";

type Props = {
  galleryId: string;
  // This same preview page, rendered without the bar, for the phone frame.
  frameSrc: string;
};

export default function FinalsPreviewBar({ galleryId, frameSrc }: Props) {
  const t = useTranslations("admin");
  const [showPhone, setShowPhone] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50 flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-neutral-900/90 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur">
        <span className="font-semibold">{t("finalDelivery.previewLabel")}</span>
        <button
          type="button"
          onClick={() => setShowPhone(true)}
          className="cursor-pointer rounded-full bg-white/10 px-3 py-1.5 font-medium transition hover:bg-white/20"
        >
          {t("finalDelivery.previewPhoneView")}
        </button>
        <Link
          href={`/admin/proof-galleries/${galleryId}`}
          className="rounded-full bg-white px-3 py-1.5 font-semibold text-neutral-900 transition hover:bg-white/90"
        >
          {t("finalDelivery.previewBackToAdmin")}
        </Link>
      </div>

      {showPhone ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black/75 p-4"
          onClick={() => setShowPhone(false)}
        >
          {/* A real 390px-wide viewport, so the page's own breakpoints
              pick the mobile hero photo, as they do on a phone. */}
          <iframe
            src={frameSrc}
            title={t("finalDelivery.previewPhoneView")}
            className="h-[min(844px,calc(100dvh-6rem))] w-[390px] max-w-full rounded-[2rem] border-[6px] border-neutral-800 bg-brand-cream"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setShowPhone(false)}
            className="cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900"
          >
            {t("finalDelivery.previewClosePhone")}
          </button>
        </div>
      ) : null}
    </>
  );
}
