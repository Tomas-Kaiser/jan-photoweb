"use client";
import Image from "next/image";
import React, { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

interface photo {
  imgSrc: string;
  objectPosition: string;
}

interface Props {
  photos: photo[];
}

const AlbumGrid = ({ photos }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const slides = photos.map((photo) => ({
    src: photo.imgSrc,
  }));

  const getGridColsClass = (count: number) => {
    if (count >= 5)
      return "xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 4)
      return "lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 3) return "md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 2) return "sm:grid-cols-2 grid-cols-1";
    return "grid-cols-1";
  };

  return (
    <>
      <div className={`grid ${getGridColsClass(photos.length)} gap-0 p-0`}>
        {photos.map((photo, index) => (
          <div
            key={index}
            onClick={() => {
              setPhotoIndex(index);
              setIsOpen(true);
            }}
            className="cursor-pointer"
          >
            <Image
              src={photo.imgSrc}
              alt={`Photo ${index}`}
              width={400}
              height={300}
              style={{ objectPosition: photo.objectPosition }}
              className="object-cover w-full h-100 transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
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

export default AlbumGrid;
