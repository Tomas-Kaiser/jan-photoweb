
import AlbumsGrid from "./albums/AlbumsGrid";
import HeroImage from "./components/HeroImage";

type ObjectPosition = {
  top: string
  top15: string
  top30: string
  center: string
}

export const objectPosition: ObjectPosition = {
  top: "top",
  top15: 'center 15%',
  top30: 'center 30%',
  center: "center",
} as const;

export const photoCoverHeroAlbums = [
  {
    name: "JANINE MADE BY LOVE",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67c0f9bf-7f87-4f65-baee-9fdf6810f700/public",
    link: "/albums/brands-and-campaign",
    objectPosition: objectPosition.top30
  },
  {
    name: "DEBBIE BROWN",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2f2f9811-e3a0-4562-8ed7-efeb265b1500/public",
    link: "/albums/",
    objectPosition: objectPosition.top15
  },
  {
    name: "WIDE SHOOTING",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0ed6883a-3978-46be-0773-97b50a45e800/public",
    link: "/albums/",
    objectPosition: objectPosition.top30
  },
  {
    name: "JANINE MADE BY LOVE",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/14789a56-e5e8-4429-6df9-c78ec4ccf000/public",
    link: "/albums/",
    objectPosition: objectPosition.top15
  },
  {
    name: "INFINIMY",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9f1fc37e-1e2c-4d06-f390-2ea4b9a83d00/public",
    link: "/albums/",
    objectPosition: objectPosition.top15
  },
  {
    name: `Portraits`,
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/da6a911f-e6cf-421d-995f-23f0ca73ea00/public",
    link: "/albums/",
    objectPosition: objectPosition.top30
  },
  {
    name: `Still in Style`,
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6bd5f04a-5de2-4104-10da-daf20cee9300/public",
    link: "/albums/",
    objectPosition: objectPosition.center
  },
  {
    name: `Couple`,
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/da5000a7-a695-4be6-b4b8-dbd28eeead00/public",
    link: "/albums/",
    objectPosition: objectPosition.top
  },
  {
    name: `Visual Story`,
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/92f6f6c1-e85f-498d-e175-a0c71c6efd00/public",
    link: "/albums/",
    objectPosition: objectPosition.center
  },
  {
    name: "Wedding",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8c6b22a7-9fae-424d-75b9-0da010ea0300/public",
    link: "/albums/weddings",
    objectPosition: objectPosition.center
  },
  {
    name: "Grandhotel Pupp",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a8865897-a6b4-4a87-53cf-f101a5ef8100/public",
    link: "/albums/",
    objectPosition: objectPosition.top15
  },
  {
    name: "Caira",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/36584577-0020-440f-09f7-04166f3aa200/public",
    link: "/albums/",
    objectPosition: objectPosition.top30
  },
  {
    name: "JANINE MADE BY LOVE",
    imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3d889cda-13a5-44f8-7300-225575d6ce00/public",
    link: "/albums/",
    objectPosition: objectPosition.top
  },
];

export default function Home() {
  const images = [
    {
      label: "Small screen",
      visibility: "block md:hidden",
      src: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67c0f9bf-7f87-4f65-baee-9fdf6810f700/full"

    },
    {
      label: "Large screen",
      visibility: "hidden md:block",
      src: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5212bdeb-d8d7-4e1f-d97c-d89e0e1f4a00/full"
    }
  ]

  return (
    <>
      {images.map(({ visibility, src }, index) => (
        <HeroImage key={index} visibility={visibility} src={src} />
      ))}
      <div className="text-center py-8 px-4 md:px-12 lg:px-24">
        <h2 className="text-3xl font-bold mb-4">Explore Our Signature Albums</h2>
        <p className="text-lg text-gray-600">
          Each collection below captures a unique story, mood, and moment. Browse through to discover the artistry behind every frame.
        </p>
      </div>
      <AlbumsGrid photoCoverAlbums={photoCoverHeroAlbums} />
    </>
  );
}
