"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

type GridItem = {
  id?: string;
  imgSrc: string;
  objectPosition: string;
  name?: string;
  href?: string;
};

interface Props {
  photos: GridItem[];
  isAdmin?: boolean;
}

const PhotoGrid = ({ photos, isAdmin = false }: Props) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

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

  const handleDeletePhoto = async (photoId: string, photoName?: string) => {
    const confirmed = window.confirm(
      `Delete this photo${photoName ? ` (${photoName})` : ""}?`
    );

    if (!confirmed) return;

    try {
      setDeletingPhotoId(photoId);

      const res = await fetch("/api/admin/photos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete photo");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete photo");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  return (
    <>
      <div className={`grid ${getGridColsClass(photos.length)} gap-0 p-0`}>
        {photos.map((photo, index) => {
          const isDeleting = deletingPhotoId === photo.id;

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
              <Link
                key={`${photo.href}-${index}`}
                href={photo.href}
                className="group block overflow-hidden"
              >
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
            <div
              key={`${photo.id ?? photo.imgSrc}-${index}`}
              className="group relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => openLightboxForGridIndex(index)}
                className="block w-full cursor-pointer overflow-hidden text-left"
              >
                {image}
              </button>

              {isAdmin && photo.id ? (
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id!, photo.name)}
                  disabled={isDeleting}
                  className="absolute right-3 top-3 z-10 rounded bg-red-600/90 px-3 py-2 text-xs font-medium text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              ) : null}

              {photo.name ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                  <p className="text-sm font-medium">{photo.name}</p>
                </div>
              ) : null}
            </div>
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