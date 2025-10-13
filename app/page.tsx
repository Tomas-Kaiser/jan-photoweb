import Link from "next/link";
import HeroImage from "./components/HeroImage";
import Image from "next/image";
import SwiperWrapper from "./components/SwiperWrapper";
import GoogleReviews from "./components/GoogleReviews";

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
  const images = [
    {
      label: "Small screen",
      visibility: "block md:hidden",
      src: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67c0f9bf-7f87-4f65-baee-9fdf6810f700/full",
    },
    {
      label: "Large screen",
      visibility: "hidden md:block",
      src: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5212bdeb-d8d7-4e1f-d97c-d89e0e1f4a00/full",
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
      <section className="px-6 py-12 max-w-6xl mx-auto bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Text Block */}
          <div className="w-full lg:w-1/2 text-gray-800 order-1 lg:order-2">
            <h2 className="text-3xl font-bold mb-4">Meet Your Photographer</h2>
            <p className="text-lg text-gray-700 mb-6">
              With a passion for capturing emotion and elegance, I specialize in
              fashion, weddings, and editorial storytelling. Every shoot is a
              collaboration — let’s create something timeless.
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
                Send a Query
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
          Portfolio Highlights
        </h2>
        <div className="flex justify-center">
          <div className="w-full xl:w-[500px]">
            <SwiperWrapper photos={photos} />
          </div>
        </div>
      </section>
      <section className="text-center py-8 px-4 md:px-12 lg:px-24">
        <h2 className="text-3xl font-bold mb-4">
          Explore Our Signature Albums
        </h2>
        <p className="text-lg text-gray-600">
          Each collection captures a unique story, mood, and moment. Browse
          through to discover the artistry behind every frame.
        </p>
        <Link
          href="/albums"
          className="mt-4 inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
        >
          View All Albums
        </Link>
      </section>
      <section className="text-center py-8 px-4 md:px-12 lg:px-24">
        <h2 className="text-3xl font-bold mb-4">Client Testimonials</h2>
        <GoogleReviews />
      </section>
    </>
  );
}
