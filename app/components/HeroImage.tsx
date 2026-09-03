"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Props {
  visibility: string;
  src: string;
}

const HeroImage = ({ visibility, src }: Props) => {
  const t = useTranslations("hero");

  return (
    <div className={`${visibility} relative w-screen h-[calc(100vh-64px)]`}>
      <Image
        src={src}
        alt={"Hero photo"}
        fill
        style={{ objectFit: "cover" }}
      ></Image>
      <div className="absolute inset-0 z-10">
        <h1 className="absolute top-[calc(50%+3.75rem)] left-1/2 w-[calc(100%-3rem)] max-w-2xl -translate-x-1/2 text-center text-xl font-semibold tracking-[0.08em] text-white mix-blend-difference [text-shadow:0_2px_8px_rgb(0_0_0_/_0.5)] md:text-3xl">
          {t("tagline")}
        </h1>
        <Link
          href="/albums"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-white px-4 py-2 text-black shadow-lg transition hover:bg-gray-100"
        >
          {t("CTAbtn")}
        </Link>
      </div>
    </div>
  );
};

export default HeroImage;
