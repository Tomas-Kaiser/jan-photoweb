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
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f814a28e-c98e-40f7-5956-0870feeb1d00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2f2d85cc-f285-4298-b5cb-a21be60e6100/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/4d8a9ec6-1d0e-45ae-9b6a-0a8ae57d9500/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/c18006ee-7380-436f-cf81-2aab704ae500/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/71072a4e-b905-49a1-d62f-3fa38fc5dc00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f7e34341-4f11-45fb-9880-6ac082ede100/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f453d1db-ad5d-452b-ec0f-cd5733116b00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2196e139-116f-4e3c-f855-ddc8589abc00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/36fc4214-609e-450f-2f83-d4f7f2124300/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/70072f92-cfff-45b1-039e-dc26a1404400/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f34129a1-4dce-4eff-0d54-0b0227296b00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/459b298a-2afd-42dc-239f-bd173ab3d500/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ee787ed5-d71c-4c92-6257-8d6ee2968f00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/bd6aa679-1421-419d-9b96-590bef48df00/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/d78513cc-d401-4e3c-329a-635a0f2c6600/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3ae4bae0-7fe5-4326-45e5-f50b49951500/public",
    "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/1e886beb-5c6a-4d33-a273-bf5cb507cf00/public",
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
