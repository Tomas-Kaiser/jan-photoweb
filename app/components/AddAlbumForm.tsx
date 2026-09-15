"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/app/lib/slugify";
import {
  MAX_UPLOAD_BYTES,
  optimizeImageForUpload,
} from "../utils/optimize-image-for-upload";

type AlbumOption = {
  id: string;
  name: string;
  path: string;
};

type FixedParent = {
  id: string;
  name: string;
  path: string;
};

type Props = {
  albums?: AlbumOption[];
  fixedParent?: FixedParent;
  locale: string;
  onBusyChange?: (busy: boolean) => void;
};

type DirectUploadResponse = {
  id: string;
  uploadURL: string;
};

type UploadStage =
  | "idle"
  | "optimizing-cover"
  | "uploading-cover"
  | "creating-album"
  | "optimizing-photo"
  | "uploading-photo"
  | "saving-photo";

type UploadFailure = {
  file: File;
  message: string;
};

export default function AddAlbumForm({
  albums = [],
  fixedParent,
  locale,
  onBusyChange,
}: Props) {
  const router = useRouter();

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<UploadFailure[]>([]);

  // Set once the album itself is successfully created, so a retry after a
  // partial photo-upload failure re-attempts only the failed photos
  // instead of trying (and failing) to create the album a second time.
  const [createdAlbum, setCreatedAlbum] = useState<{
    id: string;
    path: string;
  } | null>(null);

  const [stage, setStage] = useState<UploadStage>("idle");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");

  useEffect(() => {
    onBusyChange?.(saving);
  }, [saving, onBusyChange]);

  const effectiveParentId = fixedParent?.id ?? parentId;

  const generatedSlug = useMemo(() => slugify(name), [name]);

  const selectedParent = useMemo(() => {
    if (fixedParent) return fixedParent;
    return albums.find((album) => album.id === effectiveParentId);
  }, [albums, effectiveParentId, fixedParent]);

  const generatedPath = useMemo(() => {
    if (!generatedSlug) return "";
    return selectedParent
      ? `${selectedParent.path}/${generatedSlug}`
      : generatedSlug;
  }, [generatedSlug, selectedParent]);

  async function requestUploadUrl(): Promise<DirectUploadResponse> {
    const res = await fetch("/api/admin/photos/upload-url", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to create upload URL.");
    }

    return data;
  }

  async function uploadToCloudflare(file: File): Promise<{
    cloudflareId: string;
    name: string;
  }> {
    const { id, uploadURL } = await requestUploadUrl();

    const formData = new FormData();
    formData.append("file", file, file.name);

    const uploadRes = await fetch(uploadURL, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json().catch(() => null);

    if (!uploadRes.ok || uploadData?.success === false) {
      throw new Error(`Failed to upload image: ${file.name}`);
    }

    return {
      cloudflareId: id,
      name: file.name,
    };
  }

  function resetInputs() {
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }

    if (photosInputRef.current) {
      photosInputRef.current.value = "";
    }
  }

  function getStatusText() {
    if (!saving) return null;

    if (stage === "optimizing-cover") {
      return `Optimizing cover image: ${currentFileName}`;
    }

    if (stage === "uploading-cover") {
      return `Uploading cover image: ${currentFileName}`;
    }

    if (stage === "creating-album") {
      return "Creating album...";
    }

    const totalPhotos = photoFiles.length;
    const position = Math.min(currentPhotoIndex + 1, totalPhotos);

    if (stage === "optimizing-photo") {
      return `Optimizing photo ${position} of ${totalPhotos}: ${currentFileName}`;
    }

    if (stage === "uploading-photo") {
      return `Uploading photo ${position} of ${totalPhotos}: ${currentFileName}`;
    }

    if (stage === "saving-photo") {
      return `Saving photo ${position} of ${totalPhotos}: ${currentFileName}`;
    }

    return "Processing...";
  }

  async function uploadOnePhoto(albumId: string, file: File): Promise<void> {
    setStage("optimizing-photo");
    const optimizedPhoto = await optimizeImageForUpload(file);

    if (optimizedPhoto.size > MAX_UPLOAD_BYTES) {
      throw new Error("Still too large after optimization.");
    }

    setStage("uploading-photo");
    const uploaded = await uploadToCloudflare(optimizedPhoto);

    setStage("saving-photo");
    const photoRes = await fetch("/api/admin/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        albumId,
        name: uploaded.name,
        cloudflareId: uploaded.cloudflareId,
      }),
    });

    const photoData = await photoRes.json().catch(() => null);

    if (!photoRes.ok) {
      throw new Error(photoData?.error || "Failed to save photo.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!createdAlbum) {
      if (!name.trim()) {
        setError("Album name is required.");
        return;
      }

      if (!coverFile) {
        setError("Cover image is required.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    setFailures([]);
    setStage("idle");
    setCurrentPhotoIndex(0);
    setCurrentFileName("");

    let albumId: string;
    let albumPath: string;

    if (createdAlbum) {
      // Retrying after a partial photo-upload failure — the album
      // already exists, so skip straight to the photo uploads.
      albumId = createdAlbum.id;
      albumPath = createdAlbum.path;
    } else {
      try {
        setCurrentFileName(coverFile!.name);
        setStage("optimizing-cover");
        const optimizedCover = await optimizeImageForUpload(coverFile!);

        if (optimizedCover.size > MAX_UPLOAD_BYTES) {
          throw new Error(
            `Cover image is still too large after optimization: ${coverFile!.name}`,
          );
        }

        setStage("uploading-cover");
        const coverUpload = await uploadToCloudflare(optimizedCover);

        setStage("creating-album");
        const albumRes = await fetch("/api/admin/albums", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            parentId: effectiveParentId || null,
            coverCloudflareId: coverUpload.cloudflareId,
          }),
        });

        const albumData = await albumRes.json().catch(() => null);

        if (!albumRes.ok) {
          throw new Error(albumData?.error || "Failed to create album.");
        }

        albumId = albumData.album.id as string;
        albumPath = albumData.album.path as string;
        setCreatedAlbum({ id: albumId, path: albumPath });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setSaving(false);
        return;
      }
    }

    const totalAttempted = photoFiles.length;
    const succeeded: File[] = [];
    const failed: UploadFailure[] = [];

    for (const [index, file] of photoFiles.entries()) {
      setCurrentPhotoIndex(index);
      setCurrentFileName(file.name);

      try {
        await uploadOnePhoto(albumId, file);
        succeeded.push(file);
      } catch (err) {
        failed.push({
          file,
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    }

    setStage("idle");
    setCurrentFileName("");
    setSaving(false);

    if (!failed.length) {
      setName("");
      setParentId("");
      setCoverFile(null);
      setPhotoFiles([]);
      setCreatedAlbum(null);
      resetInputs();

      router.refresh();
      router.push(`/${locale}/albums/${albumPath}`);
      return;
    }

    // The album itself was created (or already existed from a prior
    // attempt) — only the additional photos need retrying, so keep the
    // failed ones selected instead of losing that progress.
    router.refresh();
    setPhotoFiles(failed.map((f) => f.file));
    setFailures(failed);
    setError(
      succeeded.length
        ? `Album "${name}" was created. ${succeeded.length} of ${totalAttempted} additional photos uploaded; ${failed.length} failed and stayed selected below — fix and try again.`
        : `Album "${name}" was created, but all ${failed.length} additional photo${failed.length > 1 ? "s" : ""} failed to upload — see details below.`,
    );
  }

  const statusText = getStatusText();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Album name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          disabled={saving || !!createdAlbum}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Summer wedding"
          required
        />
      </div>

      {!fixedParent ? (
        <div>
          <label
            htmlFor="parentId"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Parent album
          </label>
          <select
            id="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={saving || !!createdAlbum}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">None</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Parent album</p>
          <p className="mt-1 text-sm text-gray-900">{fixedParent.name}</p>
          <p className="mt-1 break-all text-sm text-gray-500">
            {fixedParent.path}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Live preview</p>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">Slug:</span>{" "}
            <span className="text-gray-900">
              {generatedSlug || "Will be generated while you type"}
            </span>
          </div>

          <div>
            <span className="font-medium text-gray-600">Path:</span>{" "}
            <span className="break-all text-gray-900">
              {generatedPath ||
                "Path preview will appear while you type the album name"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Cover image
        </label>

        <label
          htmlFor="coverFile"
          className="group block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 transition hover:border-gray-500 hover:bg-gray-100 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-200"
        >
          <input
            ref={coverInputRef}
            id="coverFile"
            type="file"
            accept="image/*"
            disabled={saving || !!createdAlbum}
            onChange={(e) => {
              setCoverFile(e.target.files?.[0] ?? null);
              if (error) setError(null);
            }}
            className="sr-only"
            required={!createdAlbum}
          />

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-lg text-gray-700">
              🖼️
            </div>

            <div className="min-w-0 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {createdAlbum
                  ? "Cover image saved"
                  : coverFile
                    ? "Change cover image"
                    : "Choose cover image"}
              </div>

              <div className="mt-1 text-sm text-gray-600">
                {createdAlbum
                  ? "The album already has a cover — only the additional photos below need retrying."
                  : "Click to browse and select the album cover."}
              </div>

              <div className="mt-2 text-sm text-gray-500">
                {coverFile ? (
                  <span className="break-all font-medium text-gray-800">
                    {coverFile.name}
                  </span>
                ) : (
                  "PNG, JPG, WEBP and other image formats supported."
                )}
              </div>
            </div>
          </div>
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Additional photos
        </label>

        <label
          htmlFor="photoFiles"
          className="group block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-white p-5 transition hover:border-gray-500 hover:bg-gray-50 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-200"
        >
          <input
            ref={photosInputRef}
            id="photoFiles"
            type="file"
            accept="image/*"
            multiple
            disabled={saving}
            onChange={(e) => {
              setPhotoFiles(Array.from(e.target.files ?? []));
              setError(null);
              setFailures([]);
            }}
            className="sr-only"
          />

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-lg text-gray-700">
              ⬆️
            </div>

            <div className="min-w-0 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {photoFiles.length > 0
                  ? "Change selected photos"
                  : "Choose additional photos"}
              </div>

              <div className="mt-1 text-sm text-gray-600">
                Select one or many photos to upload into this album.
              </div>

              <div className="mt-2 text-sm text-gray-500">
                {photoFiles.length > 0 ? (
                  <span className="font-medium text-gray-800">
                    {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""}{" "}
                    selected
                  </span>
                ) : (
                  "You can select multiple image files at once."
                )}
              </div>

              {photoFiles.length > 0 ? (
                <ul className="mt-3 space-y-1 text-center text-sm text-gray-600">
                  {photoFiles.slice(0, 5).map((file) => (
                    <li key={`${file.name}-${file.size}`} className="truncate">
                      {file.name}
                    </li>
                  ))}
                  {photoFiles.length > 5 ? (
                    <li className="text-gray-500">
                      + {photoFiles.length - 5} more
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>
        </label>
      </div>

      {statusText ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          {statusText}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <p>{error}</p>
          {failures.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {failures.map((failure) => (
                <li key={`${failure.file.name}-${failure.file.size}`}>
                  <span className="font-medium">{failure.file.name}</span>:{" "}
                  {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving
          ? "Saving..."
          : failures.length > 0
            ? `Retry ${failures.length} failed photo${failures.length > 1 ? "s" : ""}`
            : "Create album"}
      </button>
    </form>
  );
}
