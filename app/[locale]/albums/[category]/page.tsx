import React from "react";
import AlbumsGrid from "../AlbumsGrid";
import AlbumGrid from "../AlbumGrid";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
import { eq, asc } from "drizzle-orm";
import AddPhotoForm from "./[...slug]/AddPhotoForm";

interface Props {
  params: Promise<{ category: string }>;
}

const AlbumCategory = async ({ params }: Props) => {
  const { category } = await params;

  const session = await auth();
  const isAdmin =
    !!session?.user &&
    (session.user as { role?: string }).role === "admin";

  const categoryAlbums = await db
    .select()
    .from(albums)
    .where(eq(albums.category, category))
    .orderBy(asc(albums.sortOrder));

  const hasSubAlbums = categoryAlbums.some((a) => a.link !== null);

  let content;

  if (hasSubAlbums) {
    const photoAlbums = categoryAlbums.map((album) => ({
      title: album.brand ?? undefined,
      name: album.name,
      imgSrc: album.coverUrl,
      link: album.link ?? undefined,
      objectPosition: album.objectPosition,
    }));

    content = <AlbumsGrid photoCoverAlbums={photoAlbums} />;
  } else {
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

    content = (
      <>
        {isAdmin ? (
          <div className="mx-auto mb-10 max-w-3xl px-4">
            <AddPhotoForm albumSlug={category} />
          </div>
        ) : null}

        <AlbumGrid photos={photoList} />
      </>
    );
  }

  return (
    <>
      <div className="px-4 py-8 text-center md:px-12 lg:px-24">
        <h2 className="mb-4 text-3xl font-bold">
          {category.replace(/-/g, " ").toUpperCase()}
        </h2>

        {hasSubAlbums ? (
          <p className="text-lg text-gray-600">
            Each collection below captures a unique story, mood, and moment.
            Browse through to discover the artistry behind every frame.
          </p>
        ) : (
          <p className="text-lg text-gray-600">
            A curated selection of images from this collection.
          </p>
        )}
      </div>

      {content}
    </>
  );
};

export default AlbumCategory;