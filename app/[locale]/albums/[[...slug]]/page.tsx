import React from "react";
import type { Metadata } from "next";
import { getPageMetadata } from "@/app/lib/page-metadata";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import PhotoGrid from "../PhotoGrid";
import { getCloudflareImageUrl } from "@/app/lib/cloudflare-images";
import AlbumHeaderActions from "@/app/components/AlbumHeaderActions";
import CreateAlbumButton from "@/app/components/CreateAlbumButton";
import Breadcrumbs, { BreadcrumbItem } from "@/app/components/breadcrumbs";
import { getTranslations } from "next-intl/server";
import { HIGHLIGHTS_ALBUM_PATH } from "@/app/lib/highlights-album";
import {
  getAlbumContent,
  getAlbumOptions,
  getMovableLeafAlbums,
  getRootAlbums,
} from "@/app/lib/portfolio-cache";

type Props = {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const path = slug ? `/albums/${slug.join("/")}` : "/albums";
  return getPageMetadata(locale, "albums", path);
}

type MoveAlbumOption = {
  id: string;
  name: string;
  path: string;
};

const AlbumsPage = async ({ params }: Props) => {
  const t = await getTranslations("albums");
  const { locale, slug } = await params;
  const path = slug?.join("/") ?? null;

  // The highlights-only container is a real album row (photos need some
  // album to belong to) but must never be browsable directly.
  if (path === HIGHLIGHTS_ALBUM_PATH) {
    notFound();
  }

  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  const allAlbums = await getAlbumOptions();

  if (!path) {
    const rootAlbums = await getRootAlbums();

    const rootAlbumPhotos = rootAlbums.map((album) => ({
      id: album.id,
      name: album.name,
      imgSrc: getCloudflareImageUrl(album.coverCloudflareId, "detail"),
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

  const albumContent = await getAlbumContent(path);

  if (!albumContent) {
    notFound();
  }

  const { album, childAlbums, photos: albumPhotos } = albumContent;

  const childAlbumCards = childAlbums.map((child) => ({
    id: child.id,
    name: child.name,
    imgSrc: getCloudflareImageUrl(child.coverCloudflareId, "detail"),
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

  const movableLeafAlbums = await getMovableLeafAlbums();

  const moveAlbums: MoveAlbumOption[] = movableLeafAlbums
    .filter((candidate: MoveAlbumOption) => candidate.id !== album.id)
    .map((candidate: MoveAlbumOption) => ({
      id: candidate.id,
      name: candidate.name,
      path: candidate.path,
    }));

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
          hasPhotos={hasPhotos}
          locale={locale}
          coverImgSrc={getCloudflareImageUrl(album.coverCloudflareId, "card")}
          coverObjectPosition={album.objectPosition ?? undefined}
        />
      </div>

      <div className="mx-auto my-6 h-1 w-16 rounded-full bg-gray-300" />

      {hasChildren ? (
        <PhotoGrid
          photos={childAlbumCards}
          isAdmin={isAdmin}
          reorderType="albums"
          reorderParentId={album.id}
          revalidatePaths={[`/${locale}/albums`, currentAlbumPath]}
        />
      ) : null}

      {hasPhotos ? (
        <PhotoGrid
          photos={photoList}
          isAdmin={isAdmin}
          reorderType="photos"
          reorderAlbumId={album.id}
          revalidatePaths={[currentAlbumPath, `/${locale}/albums`]}
          moveAlbums={moveAlbums}
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
