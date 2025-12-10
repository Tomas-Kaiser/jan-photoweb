"use client";
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Autoplay,
  Pagination,
  Navigation,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface Props {
  photos: string[];
}

const SwiperWrapper = ({ photos }: Props) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <>
      <Swiper
        effect="coverflow"
        centeredSlides={true}
        slidesPerView="auto"
        grabCursor={true}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        loop
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
        className="w-full max-w-6xl mx-auto"
      >
        {photos.map((src, index) => (
          <SwiperSlide key={index} className="w-[200px]! sm:w-[300px]!">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Photo ${index + 1}`}
              className="rounded-lg w-full h-auto object-cover cursor-pointer"
              onClick={() => setSelectedPhoto(src)}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:cursor-pointer"
          >
            ×
          </button>
          <img
            src={selectedPhoto}
            alt="Enlarged"
            className="max-h-[90%] max-w-[90%] rounded-lg"
          />
        </div>
      )}
    </>
  );
};

export default SwiperWrapper;
