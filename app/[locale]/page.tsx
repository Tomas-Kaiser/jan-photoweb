import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";

import HeroImage from "../components/HeroImage";
import SwiperWrapper from "../components/SwiperWrapper";
import GoogleReviews from "../components/GoogleReviews";

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

export default function Home() {
  const t = useTranslations("landingPage");
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

  const photos = [
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2f2f9811-e3a0-4562-8ed7-efeb265b1500/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/da6a911f-e6cf-421d-995f-23f0ca73ea00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a8865897-a6b4-4a87-53cf-f101a5ef8100/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/92f6f6c1-e85f-498d-e175-a0c71c6efd00/public",
  ];
  return (
    <>
      {images.map(({ visibility, src }, index) => (
        <HeroImage key={index} visibility={visibility} src={src} />
      ))}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Text Block */}
          <div className="w-full lg:w-1/2 text-gray-800 order-1 lg:order-2">
            <h2 className="text-center text-3xl font-bold mb-4">
              {t('intro.heading')}
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              {t('intro.text')}
            </p>

            {/* Photo appears after intro on mobile, beside text on desktop */}
            <div className="flex justify-center ">
              <div className="block md:w-1/2 lg:hidden mb-6">
                <Image
                  src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/public"
                  alt="Jan Hajek"
                  width={600}
                  height={800}
                  className="rounded-lg object-cover shadow-lg w-full h-auto"
                  priority
                />
              </div>
            </div>

            <div className="flex justify-center lg:justify-start">
              <Link
                href="/contact"
                className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition"
              >
                {t('intro.btn')}
              </Link>
            </div>
          </div>

          {/* Photo for desktop view */}
          <div className="w-full lg:w-1/2 hidden lg:block order-2 lg:order-1">
            <Image
              src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/public"
              alt="Jan Hajek"
              width={600}
              height={800}
              className="rounded-lg object-cover shadow-lg w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("portfolio.heading")}
        </h2>
        <div className="flex justify-center">
          <div className="w-full xl:w-[500px]">
            <SwiperWrapper photos={photos} />
          </div>
        </div>
      </section>
      <section className="text-center py-8 px-4 md:px-12 lg:px-24  bg-gray-50">
        <h2 className="text-3xl font-bold mb-4">
          {t("albums.heading")}
        </h2>
        <p className="text-lg text-gray-600">
          {t("albums.text")}
        </p>
        <Link
          href="/albums"
          className="mt-4 inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
        >
          {t("albums.btn")}
        </Link>
      </section>
      <section className="text-center py-8 px-4 md:px-12 lg:px-24">
        <h2 className="text-3xl font-bold mb-4">{t("testimonials.heading")}</h2>
        <GoogleReviews />
      </section>
    </>
  );
}
