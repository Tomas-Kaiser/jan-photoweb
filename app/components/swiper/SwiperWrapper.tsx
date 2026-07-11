"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Autoplay,
  Pagination,
  Navigation,
} from "swiper/modules";
import styles from "./SwiperWrapper.module.css";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface PortfolioHighlightPhoto {
  id: string;
  cardSrc: string;
  fullSrc: string;
  alt: string;
  objectPosition?: string;
}

interface Props {
  photos: PortfolioHighlightPhoto[];
}

const SwiperWrapper = ({ photos }: Props) => {
  const [selectedPhoto, setSelectedPhoto] =
    useState<PortfolioHighlightPhoto | null>(null);

  return (
    <>
      <Swiper
        effect="coverflow"
        centeredSlides
        slidesPerView="auto"
        grabCursor
        loop
        spaceBetween={12}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        coverflowEffect={{
          rotate: 18,
          stretch: 0,
          depth: 120,
          modifier: 1.2,
          slideShadows: false,
          scale: 0.94,
        }}
        modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
        className={`${styles.photoSwiper} mx-auto w-full max-w-6xl`}
      >
        {photos.map((photo, index) => (
          <SwiperSlide
            key={photo.id}
            className="!w-[220px] sm:!w-[280px] lg:!w-[320px]"
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              className="block w-full cursor-pointer overflow-hidden rounded-xl"
            >
              <div className="relative h-[280px] w-full overflow-hidden rounded-xl sm:h-[340px] lg:h-[420px]">
                <Image
                  src={photo.cardSrc}
                  alt={photo.alt || `Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  style={{ objectPosition: photo.objectPosition ?? "center" }}
                  sizes="(max-width: 640px) 220px, (max-width: 1024px) 280px, 320px"
                />
              </div>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 text-3xl font-bold text-white hover:cursor-pointer"
          >
            ×
          </button>

          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto.fullSrc}
              alt={selectedPhoto.alt}
              fill
              className="rounded-lg object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SwiperWrapper;