import React from "react";
import { notFound } from "next/navigation";
import { asc, eq, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/app/db";
import { albums, photos } from "@/app/db/schema";
import PhotoGrid from "../PhotoGrid";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import AlbumHeaderActions from "@/app/components/AlbumHeaderActions";
import CreateAlbumButton from "@/app/components/CreateAlbumButton";
import Breadcrumbs, { BreadcrumbItem } from "@/app/components/breadcrumbs";
import { getTranslations } from "next-intl/server";

type Props = {
    params: Promise<{
        locale: string;
        slug?: string[];
    }>;
};

const AlbumsPage = async ({ params }: Props) => {
    const t = await getTranslations("albums");
    const { locale, slug } = await params;
    const path = slug?.join("/") ?? null;

    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    const allAlbums = await db
        .select({
            id: albums.id,
            name: albums.name,
            path: albums.path,
        })
        .from(albums)
        .orderBy(asc(albums.path));

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
            href: `/${locale}/albums/${album.path}`,
            sortOrder: album.sortOrder,
        }));

        const breadcrumbItems: BreadcrumbItem[] = [
            { label: "home", href: `/${locale}`, translate: true },
            { label: "albums", translate: true },
        ];

        return (
            <section className="pb-10 pt-10">
                <div className="px-4 text-center">
                    <div className="mx-auto mb-4 flex max-w-5xl">
                        <Breadcrumbs items={breadcrumbItems} />
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-900 capitalize">
                            {t("heading")}
                        </h2>

                        {isAdmin ? (
                            <CreateAlbumButton albums={allAlbums} locale={locale} iconOnly />
                        ) : null}
                    </div>

                    <p className="text-lg italic text-gray-600">{t("text")}</p>
                </div>

                <div className="mx-auto my-6 h-1 w-16 rounded-full bg-gray-300" />

                {rootAlbumPhotos.length ? (
                    <PhotoGrid
                        photos={rootAlbumPhotos}
                        isAdmin={isAdmin}
                        reorderType="albums"
                        reorderParentId={null}
                        revalidatePaths={[`/${locale}/albums`]}
                    />
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
        imgSrc: getCloudflareImageUrl(child.coverCloudflareId, "card"),
        objectPosition: child.objectPosition ?? "center",
        href: `/${locale}/albums/${child.path}`,
        sortOrder: child.sortOrder,
    }));

    const photoList = albumPhotos
        .filter((photo) => !!photo.cloudflareId)
        .map((photo) => ({
            id: photo.id,
            albumId: photo.albumId,
            name: photo.name ?? album.name,
            imgSrc: getCloudflareImageUrl(photo.cloudflareId!, "card"),
            objectPosition: photo.objectPosition ?? "center",
            sortOrder: photo.sortOrder,
        }));

    const hasChildren = childAlbumCards.length > 0;
    const hasPhotos = photoList.length > 0;

    const formatSlugLabel = (value: string) =>
        value
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

    const slugParts = slug ?? [];
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "home", href: `/${locale}`, translate: true },
        { label: "albums", href: `/${locale}/albums`, translate: true },
        ...slugParts.map((segment, index) => ({
            label:
                index === slugParts.length - 1 ? album.name : formatSlugLabel(segment),
            href:
                index === slugParts.length - 1
                    ? undefined
                    : `/${locale}/albums/${slugParts.slice(0, index + 1).join("/")}`,
        })),
    ];

    const currentAlbumPath = `/${locale}/albums/${album.path}`;

    return (
        <section className="pb-10 pt-10">
            <div className="px-4 text-center">
                <div className="mx-auto mb-4 flex max-w-5xl text-left">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>

                <AlbumHeaderActions
                    albumId={album.id}
                    albumName={album.name}
                    albumPath={album.path}
                    isAdmin={isAdmin}
                    albums={allAlbums}
                    hasSubalbums={hasChildren}
                    locale={locale}
                />
            </div>

            <div className="mx-auto my-6 h-1 w-16 rounded-full bg-gray-300" />

            {hasChildren ? (
                <>
                    <div className="mb-6 px-4 text-center">
                        <h3 className="text-2xl font-bold text-gray-900">
                            {t("subalbums")}
                        </h3>
                    </div>

                    <PhotoGrid
                        photos={childAlbumCards}
                        isAdmin={isAdmin}
                        reorderType="albums"
                        reorderParentId={album.id}
                        revalidatePaths={[`/${locale}/albums`, currentAlbumPath]}
                    />
                </>
            ) : null}

            {hasPhotos ? (
                <PhotoGrid
                    photos={photoList}
                    isAdmin={isAdmin}
                    reorderType="photos"
                    reorderAlbumId={album.id}
                    revalidatePaths={[currentAlbumPath, `/${locale}/albums`]}
                />
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