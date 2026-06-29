import React from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
import AlbumGrid from "../../AlbumGrid";
import AddPhotoForm from "./AddPhotoForm";

type Props = {
  params: Promise<{
    locale: string;
    category: string;
    slug: string[];
  }>;
};

const AlbumPage = async ({ params }: Props) => {
  const { category, slug: segments } = await params;
  const albumSlug = segments[segments.length - 1];

  const session = await auth();
  const isAdmin =
    !!session?.user &&
    (session.user as { role?: string }).role === "admin";

  const albumResult = await db
    .select()
    .from(albums)
    .where(eq(albums.slug, albumSlug))
    .limit(1);

  if (!albumResult.length) {
    notFound();
  }

  const album = albumResult[0];

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumSlug, albumSlug))
    .orderBy(asc(photos.sortOrder));

  const photoList = albumPhotos
    .filter((photo) => !!photo.cloudflareUrl)
    .map((photo) => ({
      name: photo.name,
      imgSrc: photo.cloudflareUrl,
      objectPosition: photo.objectPosition ?? "center",
    }));

  const title = album.brand ?? category.replaceAll("-", " ");
  const subtitle = album.name;

  return (
    <section className="pt-10 pb-10">
      <div className="text-center px-4">
        <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-900 capitalize">
          {title}
        </h2>
        <p className="text-lg italic text-gray-600 capitalize">{subtitle}</p>
      </div>

      <div className="mx-auto my-6 h-1 w-16 rounded-full bg-gray-300" />

      {isAdmin ? (
        <div className="mx-auto mb-10 max-w-2xl px-4">
          <AddPhotoForm albumSlug={albumSlug} />
        </div>
      ) : null}

      {photoList.length ? (
        <AlbumGrid photos={photoList} />
      ) : (
        <div className="px-4 py-16 text-center text-gray-500">
          No photos yet.
        </div>
      )}
    </section>
  );
};

export default AlbumPage;