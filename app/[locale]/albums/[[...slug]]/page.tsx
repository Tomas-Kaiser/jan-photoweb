import React from "react";
import { notFound } from "next/navigation";
import { asc, eq, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
import PhotoGrid from "../PhotoGrid";
import AddPhotoForm from "@/app/components/AddPhotoForm";
import AddAlbumForm from "@/app/components/AddAlbumForm";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import AlbumHeaderActions from "@/app/components/AlbumHeaderActions";

type Props = {
    params: Promise<{
        locale: string;
        slug?: string[];
    }>;
};

const AlbumsPage = async ({ params }: Props) => {
    const { slug } = await params;
    const path = slug?.join("/") ?? null;

    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    if (!path) {
        const rootAlbums = await db
            .select()
            .from(albums)
            .where(isNull(albums.parentId))
            .orderBy(asc(albums.sortOrder), asc(albums.createdAt));

        const rootAlbumPhotos = rootAlbums.map((album) => ({
            id: album.id,
            name: album.name,
            imgSrc: getCloudflareImageUrl(album.coverCloudflareId, "card"),
            objectPosition: album.objectPosition ?? "center",
            href: `/albums/${album.path}`,
        }));

        return (
            <section className="pb-10 pt-10">
                <div className="px-4 text-center">
                    <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-900 capitalize">
                        Albums
                    </h2>
                    <p className="text-lg italic text-gray-600">
                        Browse all album collections
                    </p>
                </div>

                <div className="mx-auto my-6 h-1 w-16 rounded-full bg-gray-300" />

                {isAdmin ? (
                    <div className="mx-auto mb-10 max-w-4xl px-4">
                        <AddAlbumForm />
                    </div>
                ) : null}

                {rootAlbumPhotos.length ? (
                    <PhotoGrid photos={rootAlbumPhotos} />
                ) : (
                    <div className="px-4 py-16 text-center text-gray-500">
                        No albums yet.
                    </div>
                )}
            </section>
        );
    }

    const albumResult = await db
        .select()
        .from(albums)
        .where(eq(albums.path, path))
        .limit(1);

    if (!albumResult.length) {
        notFound();
    }

    const album = albumResult[0];

    const childAlbums = await db
        .select()
        .from(albums)
        .where(eq(albums.parentId, album.id))
        .orderBy(asc(albums.sortOrder), asc(albums.createdAt));

    const albumPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.albumId, album.id))
        .orderBy(asc(photos.sortOrder), asc(photos.createdAt));

    const childAlbumCards = childAlbums.map((child) => ({
        id: child.id,
        name: child.name,
        imgSrc: child.coverUrl,
        objectPosition: child.objectPosition ?? "center",
        href: `/albums/${child.path}`,
    }));

    const photoList = albumPhotos
        .filter((photo) => !!photo.cloudflareId)
        .map((photo) => ({
            id: photo.id,
            name: photo.name ?? album.name,
            imgSrc: getCloudflareImageUrl(photo.cloudflareId!, "card"),
            objectPosition: photo.objectPosition ?? "center",
        }));

    const hasChildren = childAlbumCards.length > 0;
    const hasPhotos = photoList.length > 0;

    return (
        <section className="pb-10 pt-10">
            <div className="px-4 text-center">
                <AlbumHeaderActions
                    albumId={album.id}
                    albumName={album.name}
                    albumPath={album.path}
                    isAdmin={isAdmin}
                />
            </div>

            <div className="mx-auto my-6 h-1 w-16 rounded-full bg-gray-300" />

            {isAdmin ? (
                <div className="mx-auto mb-10 space-y-6 px-4">
                    <div className="mx-auto max-w-4xl">
                        <AddAlbumForm
                            defaultPlacement="child"
                            fixedParent={{
                                id: album.id,
                                name: album.name,
                                path: album.path,
                            }}
                        />
                    </div>

                    {!hasChildren ? (
                        <div className="mx-auto max-w-2xl">
                            <AddPhotoForm albumId={album.id} />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {hasChildren ? (
                <>
                    <div className="mb-6 px-4 text-center">
                        <h3 className="text-2xl font-bold text-gray-900">Subalbums</h3>
                    </div>
                    <PhotoGrid photos={childAlbumCards} />
                </>
            ) : null}

            {hasPhotos ? (
                <>
                    <div className="mb-6 mt-10 px-4 text-center">
                        <h3 className="text-2xl font-bold text-gray-900">Photos</h3>
                    </div>
                    <PhotoGrid photos={photoList} isAdmin={isAdmin} />
                </>
            ) : null}

            {!hasChildren && !hasPhotos ? (
                <div className="px-4 py-16 text-center text-gray-500">
                    No content yet.
                </div>
            ) : null}
        </section>
    );
};

export default AlbumsPage;