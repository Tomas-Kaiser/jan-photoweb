import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { asc, eq } from "drizzle-orm";

import HeroImage from "../components/HeroImage";
import SwiperWrapper from "../components/swiper/SwiperWrapper";


import { portfolioHighlights, photos as photosTable } from "../db/schema";
import { db } from "../db";
import ConsentGate from "../components/consent/ConsentGate";
import CookieConsentBanner from "../components/consent/CookieConsentBanner";

type ObjectPosition = {
  top: string;
  top15: string;
  top30: string;
  center: string;
};

export const objectPosition: ObjectPosition = {
  top: "top",
  top15: "center 15%",
  top30: "center 30%",
  center: "center",
} as const;

export default async function Home() {
  const t = await getTranslations("landingPage");

  const images = [
    {
      label: "Small screen",
      visibility: "block md:hidden",
      src: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b4aa0be4-c13b-4962-7fee-356a89f19300/full",
    },
    {
      label: "Large screen",
      visibility: "hidden md:block",
      src: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/873f89a4-28fe-4a5c-6187-a4b82fda0500/full",
    },
  ];

  const highlightRows = await db
    .select({
      highlightId: portfolioHighlights.id,
      sortOrder: portfolioHighlights.sortOrder,
      photoId: photosTable.id,
      cloudflareId: photosTable.cloudflareId,
      name: photosTable.name,
      photoObjectPosition: photosTable.objectPosition,
    })
    .from(portfolioHighlights)
    .innerJoin(photosTable, eq(portfolioHighlights.photoId, photosTable.id))
    .orderBy(asc(portfolioHighlights.sortOrder));

  const photos = highlightRows.map((row) => ({
    id: row.highlightId,
    cardSrc: `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${row.cloudflareId}/card`,
    fullSrc: `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${row.cloudflareId}/full`,
    alt: row.name ?? "Portfolio highlight",
    objectPosition: row.photoObjectPosition ?? "center",
  }));

  return (
    <>
      {images.map(({ visibility, src }, index) => (
        <HeroImage key={index} visibility={visibility} src={src} />
      ))}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start gap-10 lg:flex-row">
          <div className="order-1 w-full text-gray-800 lg:order-2 lg:w-1/2">
            <h2 className="mb-4 text-center text-3xl font-bold">
              {t("intro.heading")}
            </h2>
            <p className="mb-6 text-lg text-gray-700">
              {t("intro.text")}
            </p>

            <div className="flex justify-center">
              <div className="mb-6 block md:w-1/2 lg:hidden">
                <Image
                  src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/card"
                  alt="Jan Hajek"
                  width={600}
                  height={800}
                  className="h-auto w-full rounded-lg object-cover shadow-lg"
                  priority
                />
              </div>
            </div>

            <div className="flex justify-center lg:justify-start">
              <Link
                href="/contact"
                className="rounded bg-black px-6 py-3 text-white transition hover:bg-gray-800"
              >
                {t("intro.btn")}
              </Link>
            </div>
          </div>

          <div className="order-2 hidden w-full lg:order-1 lg:block lg:w-1/2">
            <Image
              src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/card"
              alt="Jan Hajek"
              width={600}
              height={800}
              className="h-auto w-full rounded-lg object-cover shadow-lg"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">
          {t("portfolio.heading")}
        </h2>
        <div className="flex justify-center">
          <div className="w-full xl:w-[500px]">
            <SwiperWrapper photos={photos} />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-8 text-center md:px-12 lg:px-24">
        <h2 className="mb-4 text-3xl font-bold">
          {t("albums.heading")}
        </h2>
        <p className="text-lg text-gray-600">
          {t("albums.text")}
        </p>
        <Link
          href="/albums"
          className="mt-4 inline-block rounded bg-black px-6 py-2 text-white transition hover:bg-gray-800"
        >
          {t("albums.btn")}
        </Link>
      </section>

      <section className="px-4 py-8 text-center md:px-12 lg:px-24">
        <h2 className="mb-4 text-3xl font-bold">
          {t("testimonials.heading")}
        </h2>
        <ConsentGate />
      </section>
    </>
  );
}