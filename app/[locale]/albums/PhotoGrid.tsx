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

  const lightboxItems = useMemo(() => items.filter((item) => !item.href), [items]);

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

  const isAlbumGridLayout = reorderType === "albums";
  // Only worth carving out a featured "big" row when there are enough
  // remaining albums to fill a real row underneath it — otherwise (2, 3,
  // or 4 subalbums) a plain evenly-sized grid looks better than a forced
  // 2-big/rest-small split.
  const useFeaturedAlbumSplit = isAlbumGridLayout && items.length >= 5;

  // Balances items into rows so no row ends up with a single item that
  // would otherwise be stretched (or left stranded) as one oversized or
  // misaligned card — e.g. 7 items over a max of 5 per row become rows of
  // [4, 3], not [5, 1].
  const getBalancedRowSizes = (total: number, maxPerRow: number): number[] => {
    if (total <= 0) return [];
    const rows = Math.ceil(total / maxPerRow);
    const base = Math.floor(total / rows);
    const remainder = total % rows;
    return Array.from({ length: rows }, (_, i) => base + (i < remainder ? 1 : 0));
  };

  const buildBalancedRows = (source: GridItem[], startIndex: number, maxPerRow: number) => {
    const rowSizes = getBalancedRowSizes(source.length, maxPerRow);
    let cursor = 0;
    return rowSizes.map((size) => {
      const rowItems = source.slice(cursor, cursor + size);
      const rowStartIndex = startIndex + cursor;
      cursor += size;
      return { size, rowItems, startIndex: rowStartIndex };
    });
  };

  const smallAlbumRows = useFeaturedAlbumSplit
    ? buildBalancedRows(items.slice(2), 2, 5)
    : [];

  const renderGridItem = (
    photo: GridItem,
    index: number,
    options?: { aspectClass?: string; roundedClass?: string; noWidthCap?: boolean }
  ) => {
    const aspectClass = options?.aspectClass ?? "aspect-[3/4]";
    const roundedClass = options?.roundedClass ?? "";
    const noWidthCap = options?.noWidthCap ?? false;

    const isDeleting = deletingPhotoId === photo.id;
    const isSelected = photo.id ? selectedPhotoIds.has(photo.id) : false;

    const image = (
      <div
        className={`relative ${aspectClass} w-full overflow-hidden bg-black ${roundedClass}`}
      >
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

    const cardWidthClass = noWidthCap
      ? ""
      : items.length === 1
        ? "max-w-sm"
        : items.length === 2
          ? "max-w-md"
          : "";

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

    const showCaption =
      Boolean(photo.name) && (Boolean(photo.href) || isAdmin);

    const caption = showCaption ? (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6 text-white">
        <span className="mb-3 block h-px w-8 bg-white/80 transition-all duration-300 group-hover:w-14" />
        <p
          className="text-sm font-light uppercase tracking-[0.2em] md:text-md"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
        >
          {photo.name}
          {savingOrder ? " · Saving order..." : ""}
        </p>
      </div>
    ) : null;

    if (photo.href) {
      return (
        <div
          key={`${photo.id ?? photo.href}-${index}`}
          className={`group relative overflow-hidden w-full ${cardWidthClass} ${roundedClass}`}
        >
          <Link href={photo.href} className="block overflow-hidden">
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
        className={`group relative overflow-hidden w-full ${cardWidthClass} ${roundedClass}`}
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
  };

  return (
    <>
      <div className="lg:px-8 xl:px-16">
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

      {isAlbumGridLayout ? (
        <>
          <div
            className={`grid ${getGridColsClass(items.length)} gap-4 p-0 lg:hidden`}
          >
            {items.map((photo, index) => renderGridItem(photo, index, { noWidthCap: true }))}
          </div>

          <div className="hidden lg:block">
            {useFeaturedAlbumSplit ? (
              <>
                {/*
                  With enough albums to fill a real row underneath, the
                  first two get a featured "big" row on top. The rest are
                  balanced into evenly-sized rows below — each row gets its
                  own column count, so a leftover row never ends up with a
                  single stretched or left-stranded card.
                */}
                <div className="mb-6 grid grid-cols-2 gap-6">
                  {items.slice(0, 2).map((photo, index) =>
                    renderGridItem(photo, index, {
                      aspectClass: "aspect-[16/10]",
                      noWidthCap: true,
                    })
                  )}
                </div>

                <div className="space-y-6">
                  {smallAlbumRows.map(({ size, rowItems, startIndex }, rowIndex) => (
                    <div
                      key={`small-row-${rowIndex}`}
                      className="grid gap-6"
                      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                    >
                      {rowItems.map((photo, i) =>
                        renderGridItem(photo, startIndex + i, { noWidthCap: true })
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Too few albums for a featured split to make sense. Stretching
              // 1–4 cards to fill the full row width (1fr columns) made them
              // huge, so instead cap each card's width and center the row —
              // cards stay a sane size and the row itself is still centered
              // rather than stranded on the left.
              <div
                className="grid justify-center gap-6"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 320px))" }}
              >
                {items.map((photo, index) =>
                  renderGridItem(photo, index, { noWidthCap: true })
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          className={`grid ${getGridColsClass(items.length)} gap-0 p-0 ${items.length <= 2 ? "justify-items-center" : ""
            }`}
        >
          {items.map((photo, index) => renderGridItem(photo, index))}
        </div>
      )}
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