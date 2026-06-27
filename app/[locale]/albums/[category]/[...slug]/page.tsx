import React from "react";
import AlbumGrid from "../../AlbumGrid";
import { db } from "@/app/db";
import { photos, albums } from "@/app/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";

interface Props {
  params: { category: string; slug: string[] };
}

const Album = async ({ params }: Props) => {
  const { category, slug: segments } = params;

  // Always the last segment — works for both /fine-furs and /janine-made-by-love/vanguard-collection-2025
  const albumSlug = segments[segments.length - 1];

  // Fetch the album metadata (name, brand) for the header
  const album = await db
    .select()
    .from(albums)
    .where(eq(albums.slug, albumSlug))
    .limit(1);

  if (!album.length) notFound();

  const albumData = album[0];

  // Fetch all photos for this album
  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumSlug, albumSlug))
    .orderBy(asc(photos.sortOrder));

  if (!albumPhotos.length) notFound();

  const photoList = albumPhotos.map((photo) => ({
    name: photo.name,
    imgSrc: photo.cloudflareUrl,
    objectPosition: photo.objectPosition,
  }));

  // Use DB values for display — no more URL-derived labels
  const title = albumData.brand ?? category.replaceAll("-", " ");
  const subtitle = albumData.name;

  return (
    <section className="pt-10 pb-10">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 capitalize tracking-tight">
          {title}
        </h2>
        <p className="text-lg text-gray-600 italic capitalize">
          {subtitle}
        </p>
      </div>
      <div className="w-16 h-1 mx-auto my-6 bg-gray-300 rounded-full" />

      <AlbumGrid photos={photoList} />
    </section>
  );
};

export default Album;