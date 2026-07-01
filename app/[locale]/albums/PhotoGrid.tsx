"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

type GridItem = {
  imgSrc: string;
  objectPosition: string;
  name?: string;
  href?: string;
};

interface Props {
  photos: GridItem[];
}

const PhotoGrid = ({ photos }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const lightboxItems = useMemo(
    () => photos.filter((photo) => !photo.href),
    [photos]
  );

  const slides = lightboxItems.map((photo) => ({
    src: photo.imgSrc,
  }));

  const getGridColsClass = (count: number) => {
    if (count >= 5) {
      return "xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    }
    if (count === 4) {
      return "lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    }
    if (count === 3) return "md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 2) return "sm:grid-cols-2 grid-cols-1";
    return "grid-cols-1";
  };

  const openLightboxForGridIndex = (index: number) => {
    const item = photos[index];
    if (item.href) return;

    const lightboxIndex = lightboxItems.findIndex(
      (photo) => photo.imgSrc === item.imgSrc && photo.name === item.name
    );

    if (lightboxIndex === -1) return;

    setPhotoIndex(lightboxIndex);
    setIsOpen(true);
  };

  return (
    <>
      <div className={`grid ${getGridColsClass(photos.length)} gap-0 p-0`}>
        {photos.map((photo, index) => {
          const image = (
            <Image
              src={photo.imgSrc}
              alt={photo.name ?? `Photo ${index + 1}`}
              width={400}
              height={300}
              style={{ objectPosition: photo.objectPosition }}
              className="h-[28rem] w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          );

          if (photo.href) {
            return (
              <Link key={`${photo.href}-${index}`} href={photo.href} className="group block overflow-hidden">
                <div className="relative overflow-hidden">
                  {image}
                  {photo.name ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                      <p className="text-sm font-medium">{photo.name}</p>
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          }

          return (
            <button
              key={`${photo.imgSrc}-${index}`}
              type="button"
              onClick={() => openLightboxForGridIndex(index)}
              className="cursor-pointer overflow-hidden text-left"
            >
              {image}
            </button>
          );
        })}
      </div>

      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        slides={slides}
        index={photoIndex}
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
};

export default PhotoGrid;