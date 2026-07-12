import { redirect } from "next/navigation";
import { asc, eq, notInArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import {
    albums,
    portfolioHighlights,
    photos as photosTable,
} from "@/app/db/schema";
import AdminHighlightsClient from "./AdminHighlightsClient";

export default async function PortfolioHighlightsAdminPage() {
    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
        redirect("/");
    }

    const highlightRows = await db
        .select({
            highlightId: portfolioHighlights.id,
            sortOrder: portfolioHighlights.sortOrder,
            photoId: photosTable.id,
            cloudflareId: photosTable.cloudflareId,
            name: photosTable.name,
            objectPosition: photosTable.objectPosition,
        })
        .from(portfolioHighlights)
        .innerJoin(photosTable, eq(portfolioHighlights.photoId, photosTable.id))
        .orderBy(asc(portfolioHighlights.sortOrder));

    const highlightedPhotoIds = highlightRows.map((row) => row.photoId);

    const availablePhotos = highlightedPhotoIds.length
        ? await db
            .select({
                id: photosTable.id,
                cloudflareId: photosTable.cloudflareId,
                name: photosTable.name,
                objectPosition: photosTable.objectPosition,
                albumId: albums.id,
                albumName: albums.name,
                albumCoverCloudflareId: albums.coverCloudflareId,
            })
            .from(photosTable)
            .innerJoin(albums, eq(photosTable.albumId, albums.id))
            .where(notInArray(photosTable.id, highlightedPhotoIds))
            .orderBy(asc(albums.name), asc(photosTable.createdAt))
        : await db
            .select({
                id: photosTable.id,
                cloudflareId: photosTable.cloudflareId,
                name: photosTable.name,
                objectPosition: photosTable.objectPosition,
                albumId: albums.id,
                albumName: albums.name,
                albumCoverCloudflareId: albums.coverCloudflareId,
            })
            .from(photosTable)
            .innerJoin(albums, eq(photosTable.albumId, albums.id))
            .orderBy(asc(albums.name), asc(photosTable.createdAt));

    const photos = highlightRows.map((row) => ({
        id: row.highlightId,
        photoId: row.photoId,
        cardSrc: `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${row.cloudflareId}/card`,
        fullSrc: `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${row.cloudflareId}/full`,
        alt: row.name ?? "Portfolio highlight",
        objectPosition: row.objectPosition ?? "center",
    }));

    const albumMap = new Map<
        string,
        {
            id: string;
            name: string;
            coverSrc: string;
            photos: {
                id: string;
                label: string;
                previewSrc: string;
            }[];
        }
    >();

    for (const photo of availablePhotos) {
        const previewSrc = `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${photo.cloudflareId}/card`;
        const albumCoverSrc = photo.albumCoverCloudflareId
            ? `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${photo.albumCoverCloudflareId}/card`
            : previewSrc;

        if (!albumMap.has(photo.albumId)) {
            albumMap.set(photo.albumId, {
                id: photo.albumId,
                name: photo.albumName,
                coverSrc: albumCoverSrc,
                photos: [],
            });
        }

        albumMap.get(photo.albumId)!.photos.push({
            id: photo.id,
            label: photo.name ?? photo.cloudflareId,
            previewSrc,
        });
    }

    const addAlbums = Array.from(albumMap.values());

    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <h1 className="mb-6 text-3xl font-bold">Portfolio highlights</h1>
            <AdminHighlightsClient photos={photos} addAlbums={addAlbums} />
        </div>
    );
}