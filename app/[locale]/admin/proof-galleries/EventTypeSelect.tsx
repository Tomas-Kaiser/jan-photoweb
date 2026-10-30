"use client";

import { useTranslations } from "next-intl";
import {
  GALLERY_EVENT_TYPES,
  type GalleryEventType,
} from "@/app/lib/gallery-event-type";

type Props = {
  id: string;
  value: GalleryEventType | null;
  onChange: (eventType: GalleryEventType | null) => void;
  disabled?: boolean;
  className?: string;
};

// The event type picker shared by the create form and the gallery screen.
// "Not set" is null.
export default function EventTypeSelect({
  id,
  value,
  onChange,
  disabled,
  className,
}: Props) {
  const t = useTranslations("admin");

  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          GALLERY_EVENT_TYPES.find((type) => type === e.target.value) ?? null,
        )
      }
      disabled={disabled}
      className={className}
    >
      <option value="">{t("proofGalleries.eventTypeNone")}</option>
      {GALLERY_EVENT_TYPES.map((type) => (
        <option key={type} value={type}>
          {t(`proofGalleries.eventTypes.${type}`)}
        </option>
      ))}
    </select>
  );
}
