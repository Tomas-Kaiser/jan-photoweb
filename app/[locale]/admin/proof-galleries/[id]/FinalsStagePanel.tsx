"use client";

import { useTranslations } from "next-intl";
import type { GalleryPermissions } from "@/app/lib/gallery-lifecycle";
import FinalPhotosSection from "./FinalPhotosSection";
import FinalsPageContentSection from "./FinalsPageContentSection";
import { LockedNotice } from "./LockedNotice";
import type { FinalPhoto } from "./types";

type Props = {
  galleryId: string;
  permissions: GalleryPermissions;
  initialFinalPhotos: FinalPhoto[];
  finalsPublishedAt: string | null;
  finalsPublishedAtLabel: string | null;
  initialEventDate: string;
  initialFinalsMessage: string;
  initialHeroMobileCloudflareId: string | null;
  initialHeroDesktopCloudflareId: string | null;
};

// Shared by the "final delivery" and "delivered" tabs.
export default function FinalsStagePanel({
  galleryId,
  permissions,
  initialFinalPhotos,
  finalsPublishedAt,
  finalsPublishedAtLabel,
  initialEventDate,
  initialFinalsMessage,
  initialHeroMobileCloudflareId,
  initialHeroDesktopCloudflareId,
}: Props) {
  const t = useTranslations("admin");

  if (!permissions.canEditFinalsPage) {
    return <LockedNotice>{t("finalDelivery.lockedUntilPaid")}</LockedNotice>;
  }

  return (
    <div className="space-y-6">
      <FinalsPageContentSection
        galleryId={galleryId}
        initialEventDate={initialEventDate}
        initialFinalsMessage={initialFinalsMessage}
        initialHeroMobileCloudflareId={initialHeroMobileCloudflareId}
        initialHeroDesktopCloudflareId={initialHeroDesktopCloudflareId}
      />

      <FinalPhotosSection
        galleryId={galleryId}
        canDelete={permissions.canDeleteFinals}
        initialFinalPhotos={initialFinalPhotos}
        finalsPublishedAt={finalsPublishedAt}
        finalsPublishedAtLabel={finalsPublishedAtLabel}
      />
    </div>
  );
}
