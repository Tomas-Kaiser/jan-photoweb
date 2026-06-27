import React from "react";
import AlbumsGrid from "../AlbumsGrid";
import AlbumGrid from "../AlbumGrid";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
import { eq, asc } from "drizzle-orm";

interface Props {
  params: { category: string };
}

const AlbumCategory = async ({ params }: Props) => {
  const { category } = await params;

  const categoryAlbums = await db
    .select()
    .from(albums)
    .where(eq(albums.category, category))
    .orderBy(asc(albums.sortOrder));

  // Categories with sub-albums (have a link) show AlbumsGrid
  // Categories without sub-albums (weddings, portraits, visual-stories) show photos directly
  const hasSubAlbums = categoryAlbums.some((a) => a.link !== null);

  let content;

  if (hasSubAlbums) {
    // Map albums to the shape AlbumsGrid expects
    const photoAlbums = categoryAlbums.map((album) => ({
      title: album.brand ?? undefined,
      name: album.name,
      imgSrc: album.coverUrl,
      link: album.link ?? undefined,
      objectPosition: album.objectPosition,
    }));
    content = <AlbumsGrid photoCoverAlbums={photoAlbums} />;
  } else {
    // Fetch photos directly for this category's slug (e.g. "weddings", "portraits")
    const categoryPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.albumSlug, category))
      .orderBy(asc(photos.sortOrder));

    const photoList = categoryPhotos.map((photo) => ({
      name: photo.name,
      imgSrc: photo.cloudflareUrl,
      objectPosition: photo.objectPosition,
    }));
    content = <AlbumGrid photos={photoList} />;
  }

  return (
    <>
      <div className="text-center py-8 px-4 md:px-12 lg:px-24">
        <h2 className="text-3xl font-bold mb-4">
          {category.replace(/-/g, " ").toUpperCase()}
        </h2>
        {hasSubAlbums && (
          <p className="text-lg text-gray-600">
            Each collection below captures a unique story, mood, and moment.
            Browse through to discover the artistry behind every frame.
          </p>
        )}
      </div>
      {content}
    </>
  );
};

export default AlbumCategory;