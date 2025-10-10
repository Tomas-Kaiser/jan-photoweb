import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  visibility: string;
  src: string;
}

const HeroImage = ({ visibility, src }: Props) => {
  return (
    <div className={`${visibility} relative w-screen h-[calc(100vh-64px)]`}>
      <Image
        src={src}
        alt={"Hero photo"}
        fill
        style={{ objectFit: "cover" }}
      ></Image>
      <Link
        href="/albums"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded shadow-lg hover:bg-gray-100 transition cursor-pointer"
      >
        Explore Albums
      </Link>
    </div>
  );
};

export default HeroImage;
