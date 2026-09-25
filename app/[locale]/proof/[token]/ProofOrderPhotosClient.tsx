"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
  detailSrc: string;
  comment: string | null;
};

type Props = {
  photos: Photo[];
};

export default function ProofOrderPhotosClient({ photos }: Props) {
  const t = useTranslations("proof");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const slides = photos.map((photo) => ({ src: photo.detailSrc }));

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo.id}>
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-4 ring-green-700 transition hover:shadow-md"
            >
              <Image
                src={photo.cardSrc}
                alt={photo.fileName}
                fill
                sizes="200px"
                className="object-cover"
              />
            </button>
            {photo.comment ? (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-medium">{t("yourNote")}:</span>{" "}
                {photo.comment}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxIndex !== null}
        close={() => setLightboxIndex(null)}
        slides={slides}
        index={lightboxIndex ?? 0}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          keyboardMoveDistance: 50,
        }}
      />
    </>
  );
}
