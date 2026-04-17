import Link from "next/link";
import React from "react";
import Image from "next/image";

interface PhotoCoverAlbums {
  title?: string;
  name?: string;
  imgSrc: string;
  link?: string;
  objectPosition: string;
}

interface Props {
  photoCoverAlbums: PhotoCoverAlbums[];
}

const AlbumsGrid = ({ photoCoverAlbums }: Props) => {
  const getGridColsClass = (count: number) => {
    if (count >= 5)
      return "xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 4)
      return "lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 3) return "md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 2) return "sm:grid-cols-2 grid-cols-1";
    return "grid-cols-1";
  };

  return (
    <div
      className={`grid ${getGridColsClass(photoCoverAlbums.length)} gap-0 p-0`}
    >
      {photoCoverAlbums.map((album, index) =>
        album.link ? (
          <Link
            href={album.link}
            key={album.link} // Use link as key, fall back to index if needed
            className="group relative overflow-hidden shadow-lg"
          >
            {/* ... Image and divs ... */}

            <Image
              src={album.imgSrc}
              alt={album.name ?? "Album Cover"}
              width={400}
              height={300}
              style={{ objectPosition: album.objectPosition }}
              className={`object-cover w-full h-100 transition-transform duration-300 group-hover:scale-105 cursor-pointer`}
            />
            {album.title && (
              <div className="absolute top-0 left-0 right-0 bg-linear-to-t from-transparent to-black/100 p-4">
                <span className="text-white text-xl font-semibold hover:underline cursor-pointer">
                  {album.title ? `${album.title}` : ""}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
              <span className="text-white text-xl font-semibold hover:underline cursor-pointer">
                {album.name ? `${album.name}` : ""}
              </span>
            </div>
          </Link>
        ) : (
          // Render as a non-clickable div if link is missing
          <div key={index} className="group relative overflow-hidden shadow-lg">
            {/* ... Image and divs ... */}
          </div>
        )
      )}
    </div>
  );
};

export default AlbumsGrid;
