"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { normalizePhotoPosition } from "@/app/utils/normalizePhotoPosition";

type GridItem = {
  id?: string;
  albumId?: string;
  imgSrc: string;
  objectPosition: string;
  sortOrder?: number;
  name?: string;
  href?: string;
};

type MoveAlbumOption = {
  id: string;
  name: string;
  path: string;
};

interface Props {
  photos: GridItem[];
  isAdmin?: boolean;
  reorderType?: "photos" | "albums";
  reorderAlbumId?: string;
  reorderParentId?: string | null;
  revalidatePaths?: string[];
  moveAlbums?: MoveAlbumOption[];
}

const PhotoGrid = ({
  photos,
  isAdmin = false,
  reorderType,
  reorderAlbumId,
  reorderParentId,
  revalidatePaths = [],
  moveAlbums = [],
}: Props) => {
  const router = useRouter();

  const [items, setItems] = useState<GridItem[]>(photos);
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [destinationAlbumId, setDestinationAlbumId] = useState("");
  const [movingPhotos, setMovingPhotos] = useState(false);

  useEffect(() => {
    setItems(photos);
    setSelectedPhotoIds(new Set());
    setDestinationAlbumId("");
  }, [photos]);

  const toFullVariant = (src: string) => {
    const cleanSrc = src.split("?")[0];
    return cleanSrc.replace(/\/[^/]+$/, "/full");
  };

  const isPhotoMode = reorderType === "photos";
  const canBulkMove = isAdmin && isPhotoMode && Boolean(reorderAlbumId);

  const lightboxItems = useMemo(
    () => items.filter((item) => !item.href),
    [items]
  );

  const slides = lightboxItems.map((photo) => ({
    src: toFullVariant(photo.imgSrc),
  }));

  const selectedCount = selectedPhotoIds.size;

  const movableAlbums = useMemo(() => {
    return moveAlbums.filter((album) => album.id !== reorderAlbumId);
  }, [moveAlbums, reorderAlbumId]);

  const getGridColsClass = (count: number) => {
    if (count >= 5) {
      return "xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    }
    if (count === 4) {
      return "lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    }
    if (count === 3) return "md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
    if (count === 2) return "sm:grid-cols-2 grid-cols-1";
    return "grid-cols-1";
  };

  const openLightboxForGridIndex = (index: number) => {
    if (!isPhotoMode) return;

    const item = items[index];
    if (item.href) return;
    if (selectedCount > 0) return;

    const lightboxIndex = lightboxItems.findIndex(
      (photo) => photo.imgSrc === item.imgSrc && photo.name === item.name
    );

    if (lightboxIndex === -1) return;

    setPhotoIndex(lightboxIndex);
    setIsOpen(true);
  };

  const toggleSelectedPhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedPhotoIds(new Set());
    setDestinationAlbumId("");
  };

  const handleMoveSelectedPhotos = async () => {
    if (!destinationAlbumId) {
      alert("Please choose a destination album.");
      return;
    }

    const photoIds = Array.from(selectedPhotoIds);

    if (!photoIds.length) {
      alert("Please select at least one photo.");
      return;
    }

    try {
      setMovingPhotos(true);

      const res = await fetch("/api/admin/photos/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceAlbumId: reorderAlbumId,
          destinationAlbumId,
          photoIds,
          revalidatePaths,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to move photos");
      }

      clearSelection();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to move photos");
    } finally {
      setMovingPhotos(false);
    }
  };

  const persistOrder = async (nextItems: GridItem[]) => {
    if (!reorderType) return;

    const reorderable = nextItems.filter(
      (item): item is GridItem & { id: string } => Boolean(item.id)
    );

    setSavingOrder(true);

    try {
      const endpoint =
        reorderType === "albums"
          ? "/api/admin/albums/reorder"
          : "/api/admin/photos/reorder";

      const payload =
        reorderType === "albums"
          ? {
            parentId: reorderParentId ?? null,
            items: reorderable.map((item, index) => ({
              id: item.id,
              sortOrder: index,
            })),
            revalidatePaths,
          }
          : {
            albumId: reorderAlbumId,
            items: reorderable.map((item, index) => ({
              id: item.id,
              sortOrder: index,
            })),
            revalidatePaths,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save order");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save order");
      setItems(photos);
    } finally {
      setSavingOrder(false);
    }
  };

  const moveItem = async (from: number, to: number) => {
    if (savingOrder || movingPhotos || selectedCount > 0) return;
    if (to < 0 || to >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setItems(next);
    await persistOrder(next);
  };

  const handleDeletePhoto = async (photoId: string, photoName?: string) => {
    const confirmed = window.confirm(
      `Delete this photo${photoName ? ` (${photoName})` : ""}?`
    );

    if (!confirmed) return;

    try {
      setDeletingPhotoId(photoId);

      const res = await fetch("/api/admin/photos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete photo");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete photo");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  return (
    <>
      {canBulkMove ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-700">
            {selectedCount > 0
              ? `${selectedCount} photo${selectedCount > 1 ? "s" : ""} selected`
              : "Select photos to move them to another album"}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={destinationAlbumId}
              onChange={(e) => setDestinationAlbumId(e.target.value)}
              disabled={movingPhotos}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Choose destination album</option>
              {movableAlbums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void handleMoveSelectedPhotos()}
              disabled={!selectedCount || !destinationAlbumId || movingPhotos}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {movingPhotos ? "Moving..." : "Move selected"}
            </button>

            <button
              type="button"
              onClick={clearSelection}
              disabled={!selectedCount || movingPhotos}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className={`grid ${getGridColsClass(items.length)} gap-0 p-0`}>
        {items.map((photo, index) => {
          const isDeleting = deletingPhotoId === photo.id;
          const isSelected = photo.id ? selectedPhotoIds.has(photo.id) : false;

          const image = (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
              <Image
                src={photo.imgSrc}
                alt={photo.name ?? `Photo ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                style={{
                  objectPosition: normalizePhotoPosition(photo.objectPosition),
                }}
                className={`object-cover transition-transform duration-300 ${isSelected ? "scale-[1.02] opacity-80" : "group-hover:scale-105"
                  }`}
              />

              {isSelected ? (
                <div className="pointer-events-none absolute inset-0 z-10 ring-4 ring-white/80 ring-inset" />
              ) : null}
            </div>
          );

          const adminMoveControls =
            isAdmin && reorderType && photo.id ? (
              <div className="absolute left-3 top-3 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void moveItem(index, index - 1);
                  }}
                  disabled={index === 0 || savingOrder || selectedCount > 0 || movingPhotos}
                  className="rounded border border-white/10 bg-green-800/80 px-3 py-2 text-xs font-medium text-white shadow-md hover:bg-green-900 active:bg-green-950 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Move earlier"
                  title="Move earlier"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void moveItem(index, index + 1);
                  }}
                  disabled={
                    index === items.length - 1 ||
                    savingOrder ||
                    selectedCount > 0 ||
                    movingPhotos
                  }
                  className="rounded border border-white/10 bg-green-800/80 px-3 py-2 text-xs font-medium text-white shadow-md hover:bg-green-900 active:bg-green-950 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Move later"
                  title="Move later"
                >
                  →
                </button>
              </div>
            ) : null;

          const adminDeleteButton =
            isAdmin && isPhotoMode && photo.id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleDeletePhoto(photo.id!, photo.name);
                }}
                disabled={isDeleting || movingPhotos}
                className="absolute right-3 top-3 z-20 rounded bg-red-600/90 px-3 py-2 text-xs font-medium text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : null;

          const selectButton =
            canBulkMove && photo.id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSelectedPhoto(photo.id!);
                }}
                disabled={movingPhotos}
                className={`absolute bottom-3 right-3 z-20 inline-flex h-11 items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold shadow-lg backdrop-blur-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${isSelected
                    ? "border-white bg-emerald-800 text-white hover:bg-emerald-900"
                    : "border-white bg-black/80 text-white hover:bg-black"
                  }`}
                aria-pressed={isSelected}
                aria-label={isSelected ? "Deselect photo" : "Select photo"}
                title={isSelected ? "Deselect photo" : "Select photo"}
              >
                <span aria-hidden="true">{isSelected ? "✓" : "○"}</span>
                <span>{isSelected ? "Selected" : "Select"}</span>
              </button>
            ) : null;

          const showCaption = Boolean(photo.name) && (Boolean(photo.href) || isAdmin);
          const caption = showCaption ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
              <p className="text-sm font-medium">
                {photo.name}
                {savingOrder ? " · Saving order..." : ""}
              </p>
            </div>
          ) : null;

          if (photo.href) {
            return (
              <div
                key={`${photo.id ?? photo.href}-${index}`}
                className="group relative overflow-hidden"
              >
                <Link
                  href={photo.href}
                  className="block overflow-hidden"
                >
                  {image}
                </Link>

                {adminMoveControls}
                {selectButton}
                {caption}
              </div>
            );
          }

          return (
            <div
              key={`${photo.id ?? photo.imgSrc}-${index}`}
              className="group relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => openLightboxForGridIndex(index)}
                className="block w-full cursor-pointer overflow-hidden text-left"
              >
                {image}
              </button>

              {adminMoveControls}
              {adminDeleteButton}
              {selectButton}
              {caption}
            </div>
          );
        })}
      </div>

      {isPhotoMode ? (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={slides}
          index={photoIndex}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 1.2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            keyboardMoveDistance: 50,
          }}
        />
      ) : null}
    </>
  );
};

export default PhotoGrid;