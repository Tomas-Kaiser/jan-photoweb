"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import SwiperWrapper, {
  PortfolioHighlightPhoto,
} from "@/app/components/swiper/SwiperWrapper";
import {
  MAX_UPLOAD_BYTES,
  optimizeImageForUpload,
} from "@/app/utils/optimize-image-for-upload";
import {
  addPortfolioHighlight,
  deletePortfolioHighlight,
  movePortfolioHighlightLeft,
  movePortfolioHighlightRight,
  uploadPhotoToHighlights,
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

type AddMode = "existing" | "upload" | null;

export default function AdminHighlightsClient({ photos, addAlbums }: Props) {
  const t = useTranslations("admin");
  const [mode, setMode] = useState<AddMode>(null);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();

  const activeAlbum = useMemo(
    () => addAlbums.find((album) => album.id === activeAlbumId) ?? null,
    [addAlbums, activeAlbumId],
  );

  const openAlbum = (albumId: string) => {
    setActiveAlbumId(albumId);
  };

  const handleBackToAlbums = () => {
    setActiveAlbumId(null);
    setPendingPhotoId(null);
  };

  const handleChangeMethod = () => {
    setMode(null);
    setActiveAlbumId(null);
    setPendingPhotoId(null);
    setUploadFile(null);
    setUploadError(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleAdd = (photoId: string) => {
    setPendingPhotoId(photoId);

    startTransition(async () => {
      await addPortfolioHighlight(photoId);
      setPendingPhotoId(null);
      setActiveAlbumId(null);
    });
  };

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadFile) {
      setUploadError(t("highlights.selectFileRequired"));
      return;
    }

    const file = uploadFile;

    startUploadTransition(async () => {
      try {
        const optimized = await optimizeImageForUpload(file);

        if (optimized.size > MAX_UPLOAD_BYTES) {
          throw new Error(t("upload.stillTooLarge"));
        }

        const uploadUrlRes = await fetch("/api/admin/photos/upload-url", {
          method: "POST",
        });
        const uploadUrlData = await uploadUrlRes.json().catch(() => null);

        if (!uploadUrlRes.ok) {
          throw new Error(uploadUrlData?.error || t("upload.createUrlFailed"));
        }

        const formData = new FormData();
        formData.append("file", optimized, optimized.name);

        const cfRes = await fetch(uploadUrlData.uploadURL, {
          method: "POST",
          body: formData,
        });
        const cfData = await cfRes.json().catch(() => null);

        if (!cfRes.ok || cfData?.success === false) {
          throw new Error(t("upload.uploadImageFailed", { name: file.name }));
        }

        await uploadPhotoToHighlights(uploadUrlData.id, file.name);

        setUploadFile(null);
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : t("common.genericError"),
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          {t("highlights.addHighlight")}
        </h2>

        {mode === null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 p-4 text-left transition hover:border-gray-400 hover:shadow-sm"
            >
              <span aria-hidden="true" className="text-2xl">
                🖼️
              </span>
              <span className="font-semibold text-gray-900">
                {t("highlights.chooseExistingPhoto")}
              </span>
              <span className="text-sm text-gray-600">
                {t("highlights.selectAlbum")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("upload")}
              className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 p-4 text-left transition hover:border-gray-400 hover:shadow-sm"
            >
              <span aria-hidden="true" className="text-2xl">
                ⬆️
              </span>
              <span className="font-semibold text-gray-900">
                {t("highlights.uploadNewPhoto")}
              </span>
              <span className="text-sm text-gray-600">
                {t("highlights.uploadHint")}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleChangeMethod}
            className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ← {t("highlights.changeMethod")}
          </button>
        )}

        {mode === null ? null : mode === "upload" ? (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("highlights.uploadHint")}
            </p>

            <div>
              <label
                htmlFor="highlightPhotoFile"
                className="group block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-white p-5 transition hover:border-gray-500 hover:bg-gray-50 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-200"
              >
                <input
                  ref={uploadInputRef}
                  id="highlightPhotoFile"
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    setUploadFile(e.target.files?.[0] ?? null);
                    setUploadError(null);
                  }}
                  className="sr-only"
                />

                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-lg text-gray-700">
                    ⬆️
                  </div>

                  <div className="min-w-0 text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {uploadFile
                        ? t("highlights.changeFile")
                        : t("highlights.chooseFile")}
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                      {uploadFile ? (
                        <span className="break-all font-medium text-gray-800">
                          {uploadFile.name}
                        </span>
                      ) : (
                        t("highlights.noFileHint")
                      )}
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {uploadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {uploadError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isUploading
                ? t("common.uploading")
                : t("highlights.uploadAndAdd")}
            </button>
          </form>
        ) : addAlbums.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t("highlights.allInHighlights")}
          </p>
        ) : !activeAlbum ? (
          <>
            <p className="mb-4 text-sm text-gray-600">
              {t("highlights.selectAlbum")}
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
                    <div className="font-medium text-gray-900">
                      {album.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t("highlights.photoCount", {
                        count: album.photos.length,
                      })}
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
                <p className="text-sm text-gray-500">
                  {t("highlights.albumLabel")}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeAlbum.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleBackToAlbums}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t("highlights.backToAlbums")}
              </button>
            </div>

            {activeAlbum.photos.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("highlights.noAvailablePhotos")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {activeAlbum.photos.map((photo) => {
                  const isThisPending =
                    isPending && pendingPhotoId === photo.id;

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
                          {isThisPending
                            ? t("highlights.adding")
                            : t("highlights.addToHighlights")}
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
        <h2 className="mb-4 text-xl font-semibold">
          {t("highlights.currentHighlights")}
        </h2>
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
