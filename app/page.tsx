import AlbumsGrid from "./albums/AlbumsGrid";
import HeroImage from "./components/HeroImage";

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

  return (
    <>
      {images.map(({ visibility, src }, index) => (
        <HeroImage key={index} visibility={visibility} src={src} />
      ))}
      <div className="text-center py-8 px-4 md:px-12 lg:px-24">
        <h2 className="text-3xl font-bold mb-4">
          Explore Our Signature Albums
        </h2>
        <p className="text-lg text-gray-600">
          Each collection below captures a unique story, mood, and moment.
          Browse through to discover the artistry behind every frame.
        </p>
      </div>
    </>
  );
}
