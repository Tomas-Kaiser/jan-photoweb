"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

import DeleteAlbumButton from "@/app/components/DeleteAlbumButton";
import CreateAlbumButton from "./CreateAlbumButton";
import { normalizePhotoPosition } from "@/app/utils/normalizePhotoPosition";
import {
  MAX_UPLOAD_BYTES,
  optimizeImageForUpload,
} from "../utils/optimize-image-for-upload";

type AlbumOption = {
  id: string;
  name: string;
  path: string;
};

type Props = {
  albumId: string;
  albumName: string;
  albumPath: string;
  isAdmin: boolean;
  albums: AlbumOption[];
  hasSubalbums: boolean;
  hasPhotos: boolean;
  locale: string;
  coverImgSrc: string;
  coverObjectPosition?: string;
};

export default function AlbumHeaderActions({
  albumId,
  albumName,
  albumPath,
  isAdmin,
  albums,
  hasSubalbums,
  hasPhotos,
  locale,
  coverImgSrc,
  coverObjectPosition,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(albumName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [coverSaving, setCoverSaving] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage(t("album.nameRequired"));
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("album.updateFailed"));
      }

      setIsEditing(false);
      router.push(`/${locale}/albums/${data.path}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("common.genericError"),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setName(albumName);
    setMessage("");
  }

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";

    if (!file) return;

    try {
      setCoverSaving(true);
      setCoverMessage("");

      const optimized = await optimizeImageForUpload(file);

      if (optimized.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          t("upload.coverTooLarge", { name: file.name }),
        );
      }

      const uploadUrlRes = await fetch("/api/admin/photos/upload-url", {
        method: "POST",
      });
      const uploadUrlData = await uploadUrlRes.json().catch(() => null);

      if (!uploadUrlRes.ok) {
        throw new Error(uploadUrlData?.error || t("upload.createUrlFailed"));
      }

      const formData = new FormData();
      formData.append("file", optimized, file.name);

      const uploadRes = await fetch(uploadUrlData.uploadURL, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok || uploadData?.success === false) {
        throw new Error(t("upload.uploadImageFailed", { name: file.name }));
      }

      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: albumName,
          coverCloudflareId: uploadUrlData.id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("album.coverUpdateFailed"));
      }

      router.refresh();
    } catch (error) {
      setCoverMessage(
        error instanceof Error ? error.message : t("common.genericError"),
      );
    } finally {
      setCoverSaving(false);
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleSave();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="min-w-[220px] rounded-xl border border-gray-300 px-3 py-2 text-center text-4xl font-extrabold tracking-tight text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200"
            aria-label={t("album.nameFieldLabel")}
          />
        ) : (
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 capitalize">
            {albumName}
          </h2>
        )}

        {isAdmin ? (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setMessage("");
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                  aria-label={t("album.editName")}
                  title={t("album.editName")}
                >
                  <span aria-hidden="true">✏️</span>
                </button>
                <CreateAlbumButton
                  albums={albums}
                  fixedParent={{
                    id: albumId,
                    name: albumName,
                    path: albumPath,
                  }}
                  canAddPhotosToCurrentAlbum={!hasSubalbums}
                  locale={locale}
                />

                <DeleteAlbumButton
                  albumId={albumId}
                  albumName={albumName}
                  redirectTo={`/${locale}/albums`}
                  hasSubalbums={hasSubalbums}
                  hasPhotos={hasPhotos}
                  iconOnly
                />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? t("common.saving") : t("common.save")}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <p className="mt-2 text-xs text-gray-500">
          {t("album.editHint")}
        </p>
      ) : null}

      {isAdmin ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-gray-700">
            {t("album.previewCover")}
          </p>

          <div className="group relative h-32 w-32 overflow-hidden rounded-2xl border border-gray-200 shadow-sm sm:h-40 sm:w-40">
            <Image
              src={coverImgSrc}
              alt={`${albumName} cover`}
              fill
              sizes="160px"
              style={{
                objectPosition: normalizePhotoPosition(coverObjectPosition),
              }}
              className="object-cover"
            />

            <button
              type="button"
              onClick={() => {
                setCoverMessage("");
                coverInputRef.current?.click();
              }}
              disabled={coverSaving}
              className="absolute bottom-1.5 right-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white shadow-md backdrop-blur transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t("album.changeCover")}
              title={t("album.changeCover")}
            >
              <span aria-hidden="true">{coverSaving ? "⏳" : "🖼️"}</span>
            </button>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleCoverFileChange}
            />
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-3 inline-block rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      {coverMessage ? (
        <div className="mt-3 inline-block rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {coverMessage}
        </div>
      ) : null}
    </>
  );
}
