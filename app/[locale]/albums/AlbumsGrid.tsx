import Link from "next/link";
import React from "react";
import Image from "next/image";

import DeleteAlbumButton from "@/app/components/DeleteAlbumButton";

interface PhotoCoverAlbums {
  id?: string;
  title?: string;
  name?: string;
  imgSrc: string;
  href?: string;
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
        album.href ? (
          <div
            key={album.href}
            className="group relative overflow-hidden shadow-lg"
          >
            {album.id ? (
              <div className="absolute right-3 top-3 z-20">
                <DeleteAlbumButton
                  albumId={album.id}
                  albumName={album.name}
                  className="rounded bg-red-600/90 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                />
              </div>
            ) : null}

            <Link href={album.href} className="block">
              <Image
                src={album.imgSrc}
                alt={album.name ?? "Album Cover"}
                width={400}
                height={300}
                style={{ objectPosition: album.objectPosition }}
                className="h-100 w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {album.title && (
                <div className="absolute left-0 right-0 top-0 bg-linear-to-t from-transparent to-black/100 p-4">
                  <span className="cursor-pointer text-xl font-semibold text-white hover:underline">
                    {album.title}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
                <span className="cursor-pointer text-xl font-semibold text-white hover:underline">
                  {album.name ?? ""}
                </span>
              </div>
            </Link>
          </div>
        ) : (
          <div key={index} className="group relative overflow-hidden shadow-lg">
            <Image
              src={album.imgSrc}
              alt={album.name ?? "Album Cover"}
              width={400}
              height={300}
              style={{ objectPosition: album.objectPosition }}
              className="h-100 w-full object-cover transition-transform duration-300"
            />

            {album.title && (
              <div className="absolute left-0 right-0 top-0 bg-linear-to-t from-transparent to-black/100 p-4">
                <span className="text-xl font-semibold text-white">
                  {album.title}
                </span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
              <span className="text-xl font-semibold text-white">
                {album.name ?? ""}
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default AlbumsGrid;