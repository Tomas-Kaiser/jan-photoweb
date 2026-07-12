"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import SwiperWrapper, {
    PortfolioHighlightPhoto,
} from "@/app/components/swiper/SwiperWrapper";
import {
    addPortfolioHighlight,
    deletePortfolioHighlight,
    movePortfolioHighlightLeft,
    movePortfolioHighlightRight,
} from "./actions";

type AlbumPhoto = {
    id: string;
    label: string;
    previewSrc: string;
};

type AddAlbum = {
    id: string;
    name: string;
    coverSrc: string;
    photos: AlbumPhoto[];
};

type Props = {
    photos: (PortfolioHighlightPhoto & { photoId: string })[];
    addAlbums: AddAlbum[];
};

export default function AdminHighlightsClient({
    photos,
    addAlbums,
}: Props) {
    const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
    const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const activeAlbum = useMemo(
        () => addAlbums.find((album) => album.id === activeAlbumId) ?? null,
        [addAlbums, activeAlbumId]
    );

    const openAlbum = (albumId: string) => {
        setActiveAlbumId(albumId);
    };

    const handleBackToAlbums = () => {
        setActiveAlbumId(null);
        setPendingPhotoId(null);
    };

    const handleAdd = (photoId: string) => {
        setPendingPhotoId(photoId);

        startTransition(async () => {
            await addPortfolioHighlight(photoId);
            setPendingPhotoId(null);
            setActiveAlbumId(null);
        });
    };

    return (
        <div className="space-y-8">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Add highlight</h2>

                {addAlbums.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        All photos are already in highlights.
                    </p>
                ) : !activeAlbum ? (
                    <>
                        <p className="mb-4 text-sm text-gray-600">
                            Select an album to browse its photos.
                        </p>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {addAlbums.map((album) => (
                                <button
                                    key={album.id}
                                    type="button"
                                    onClick={() => openAlbum(album.id)}
                                    className="overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-gray-400 hover:shadow-sm"
                                >
                                    <div className="relative aspect-[4/3] w-full bg-gray-100">
                                        <Image
                                            src={album.coverSrc}
                                            alt={album.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                                        />
                                    </div>

                                    <div className="p-3">
                                        <div className="font-medium text-gray-900">{album.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {album.photos.length} photo{album.photos.length === 1 ? "" : "s"}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">Album</p>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {activeAlbum.name}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={handleBackToAlbums}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Back to albums
                            </button>
                        </div>

                        {activeAlbum.photos.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No available photos in this album.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {activeAlbum.photos.map((photo) => {
                                    const isThisPending = isPending && pendingPhotoId === photo.id;

                                    return (
                                        <div
                                            key={photo.id}
                                            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                                        >
                                            <div className="relative aspect-[3/4] w-full bg-gray-100">
                                                <Image
                                                    src={photo.previewSrc}
                                                    alt={photo.label}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
                                                />
                                            </div>

                                            <div className="space-y-2 p-2">
                                                <div className="line-clamp-2 text-xs text-gray-700">
                                                    {photo.label}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(photo.id)}
                                                    disabled={isPending}
                                                    className="w-full rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                                                >
                                                    {isThisPending ? "Adding..." : "Add to highlights"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Current highlights</h2>
                <SwiperWrapper
                    photos={photos}
                    isAdmin
                    onDelete={deletePortfolioHighlight}
                    onMoveLeft={movePortfolioHighlightLeft}
                    onMoveRight={movePortfolioHighlightRight}
                />
            </div>
        </div>
    );
}