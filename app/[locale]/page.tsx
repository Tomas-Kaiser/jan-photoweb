import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { asc, eq } from "drizzle-orm";

import HeroImage from "../components/HeroImage";
import Reveal from "../components/Reveal";
import SwiperWrapper from "../components/swiper/SwiperWrapper";


import { portfolioHighlights, photos as photosTable } from "../db/schema";
import { db } from "../db";
import ConsentGate from "../components/consent/ConsentGate";
import { getFeaturedHomepageAlbums } from "../lib/homepage-albums";
import SocialPopup from "../components/SocialPopup";

export const metadata: Metadata = {
  title: "Jan Hájek | Photography Portfolio & Workshops",
  description:
    "Photography that holds on to real moments. Explore the portfolio and workshops of Jan Hájek.",
};

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

const serviceCards = [
  {
    key: "couples",
    href: "/contact?service=couples",
    backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/302f0c15-eec3-4117-9d5b-34b80556fe00/card",
  },
  {
    key: "weddings",
    href: "/contact?service=wedding",
    backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8d0ba214-31f8-470f-a3f2-1f247a40f000/card",
  },
  {
    key: "voucher",
    href: "/contact?service=voucher",
    backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/50b4c52f-bd2f-4a2a-e144-06fd782ebe00/card",
  },
] as const;

export default async function Home() {
  const t = await getTranslations("landingPage");
  const locale = await getLocale();

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

  const featuredAlbums = await getFeaturedHomepageAlbums(locale);

  return (
    <>
      <SocialPopup />
      {images.map(({ visibility, src }, index) => (
        <HeroImage key={index} visibility={visibility} src={src} />
      ))}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start gap-10 lg:flex-row">
          <Reveal delay={150} className="order-1 w-full text-gray-800 lg:order-2 lg:w-1/2">
            <div>
              <h2 className="mb-4 text-center text-3xl font-bold">
                {t("intro.heading")}
              </h2>
              <p className="mb-4 text-lg text-gray-700">
                {t("intro.text")}
              </p>
              <p className="mb-4 text-lg text-gray-700">
                {t("intro.text-2")}
              </p>
              <p className="mb-6 text-lg font-medium text-gray-800">
                {t("intro.text-3")}
              </p>

              <div className="flex justify-center">
                <div className="mb-6 block md:w-1/2 lg:hidden">
                  <Image
                    src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/card"
                    alt="Jan Hájek"
                    width={600}
                    height={800}
                    className="h-auto w-full rounded-lg object-cover shadow-lg"
                    priority
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/contact"
                  className="rounded bg-black px-6 py-3 text-white transition hover:bg-gray-800"
                >
                  {t("intro.btn")}
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="order-2 hidden w-full lg:order-1 lg:block lg:w-1/2">
            <Image
              src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/card"
              alt="Jan Hájek"
              width={600}
              height={800}
              className="h-auto w-full rounded-lg object-cover shadow-lg"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-stone-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            {t("portfolio.heading")}
          </h2>
          <Reveal>
            <div className="flex justify-center">
              <div className="w-full xl:w-[500px]">
                <SwiperWrapper photos={photos} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {t("services.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-gray-600">
            {t("services.text")}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {serviceCards.map(({ key, href, backgroundImage }, index) => (
              <Reveal key={key} delay={index * 120} className="flex">
                <article
                  className="group relative flex min-h-72 w-full flex-col overflow-hidden rounded-xl border border-gray-200 p-7 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <Image src={backgroundImage} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="relative flex h-full flex-col text-white">
                    <h3 className="text-2xl font-semibold">
                      {t(`services.${key}.title`)}
                    </h3>
                    <p className="mt-3 text-gray-100">
                      {t(`services.${key}.text`)}
                    </p>
                    <Link
                      href={href}
                      className="mt-auto pt-8 font-semibold text-white underline underline-offset-4 transition hover:text-gray-200"
                    >
                      {t(`services.${key}.btn`)}
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="rounded bg-black px-6 py-3 text-white transition hover:bg-gray-800"
            >
              {t("services.all")}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-stone-50 px-4 py-20 text-center md:px-12 lg:px-24">
        <Reveal>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            {t("albums.heading")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            {t("albums.text")}
          </p>
        </Reveal>

        {featuredAlbums.length > 0 ? (
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 text-left md:h-[420px] md:grid-cols-2">
            {featuredAlbums.map((album, index) => (
              <Reveal key={album.id} delay={120 + index * 120} className="h-full">
                <Link
                  href={album.href}
                  className="group relative block h-full min-h-80 overflow-hidden rounded-2xl"
                >
                  <Image
                    src={album.imgSrc}
                    alt={album.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    style={{ objectPosition: album.objectPosition }}
                    className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-6">
                    <h3 className="text-2xl font-semibold text-white">
                      {album.name}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1 font-semibold text-white transition group-hover:text-gray-200">
                      <span className="underline underline-offset-4">{t("albums.explore")}</span>
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : null}

        <Reveal delay={480}>
          <Link
            href="/albums"
            className="mt-12 inline-block rounded bg-black px-6 py-3 text-white transition hover:bg-gray-800"
          >
            {t("albums.btn")}
          </Link>
        </Reveal>
      </section>

      <section className="px-4 py-8 text-center md:px-12 lg:px-24">
        <h2 className="mb-4 text-3xl font-bold">
          {t("testimonials.heading")}
        </h2>
        <ConsentGate />
        <a
          href="https://www.google.com/maps/place/Fotograf+Jan+H%C3%A1jek/@51.011085,-6.2617611,5z/data=!4m10!1m2!2m1!1shajek+jan+fotograf!3m6!1s0xa2490db466896cd3:0x9724b51fa6006b7d!8m2!3d50.4621918!4d13.7458963!15sChJoYWplayBqYW4gZm90b2dyYWaSAQxwaG90b2dyYXBoZXLgAQA!16s%2Fg%2F11x8z_y162?entry=ttu&g_ep=EgoyMDI2MDkxNC4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded bg-black px-6 py-2 text-white transition hover:bg-gray-800"
        >
          {t("testimonials.reviewBtn")}
        </a>
      </section>
    </>
  );
}
