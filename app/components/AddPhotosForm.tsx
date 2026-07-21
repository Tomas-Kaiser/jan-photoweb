"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    MAX_UPLOAD_BYTES,
    optimizeImageForUpload,
} from "../utils/optimize-image-for-upload";

type Album = {
    id: string;
    name: string;
    path: string;
};

type Props = {
    album: Album;
};

type DirectUploadResponse = {
    id: string;
    uploadURL: string;
};

type UploadStage = "idle" | "optimizing" | "uploading" | "saving";

export default function AddPhotosForm({ album }: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [files, setFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<UploadStage>("idle");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentFileName, setCurrentFileName] = useState<string>("");

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

    function resetFileInput() {
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function getStatusText() {
        if (!saving) return null;

        const total = files.length;
        const position = Math.min(currentIndex + 1, total);

        if (stage === "optimizing") {
            return `Optimizing ${position} of ${total}: ${currentFileName}`;
        }

        if (stage === "uploading") {
            return `Uploading ${position} of ${total}: ${currentFileName}`;
        }

        if (stage === "saving") {
            return `Saving ${position} of ${total}: ${currentFileName}`;
        }

        return "Processing photos...";
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!files.length) {
            setError("Please select at least one photo.");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setStage("idle");
            setCurrentIndex(0);
            setCurrentFileName("");

            for (const [index, file] of files.entries()) {
                setCurrentIndex(index);
                setCurrentFileName(file.name);

                setStage("optimizing");
                const optimizedFile = await optimizeImageForUpload(file);

                if (optimizedFile.size > MAX_UPLOAD_BYTES) {
                    throw new Error(
                        `Image is still too large after optimization: ${file.name}`
                    );
                }

                setStage("uploading");
                const { id, uploadURL } = await requestUploadUrl();

                const formData = new FormData();
                formData.append("file", optimizedFile, optimizedFile.name);

                const uploadRes = await fetch(uploadURL, {
                    method: "POST",
                    body: formData,
                });

                const uploadData = await uploadRes.json().catch(() => null);

                if (!uploadRes.ok || uploadData?.success === false) {
                    throw new Error(`Failed to upload image: ${file.name}`);
                }

                setStage("saving");
                const photoRes = await fetch("/api/admin/photos", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        albumId: album.id,
                        name: file.name,
                        cloudflareId: id,
                    }),
                });

                const photoData = await photoRes.json().catch(() => null);

                if (!photoRes.ok) {
                    throw new Error(
                        photoData?.error || `Failed to save photo: ${file.name}`
                    );
                }
            }

            setFiles([]);
            resetFileInput();
            setStage("idle");
            setCurrentIndex(0);
            setCurrentFileName("");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    const statusText = getStatusText();

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Add photos
                </label>

                <label
                    htmlFor="albumPhotos"
                    className="group block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-white p-5 transition hover:border-gray-500 hover:bg-gray-50 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-200"
                >
                    <input
                        ref={inputRef}
                        id="albumPhotos"
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={saving}
                        onChange={(e) => {
                            setFiles(Array.from(e.target.files ?? []));
                            if (error) setError(null);
                        }}
                        className="sr-only"
                    />

                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-lg text-gray-700">
                            ⬆️
                        </div>

                        <div className="min-w-0 text-center">
                            <div className="text-sm font-semibold text-gray-900">
                                {files.length > 0 ? "Change selected photos" : "Choose photos"}
                            </div>

                            <div className="mt-1 text-sm text-gray-600">
                                Select one or many photos to add to this album.
                            </div>

                            <div className="mt-2 text-sm text-gray-500">
                                {files.length > 0 ? (
                                    <span className="font-medium text-gray-800">
                                        {files.length} file{files.length > 1 ? "s" : ""} selected
                                    </span>
                                ) : (
                                    "You can select multiple image files at once."
                                )}
                            </div>

                            {files.length > 0 ? (
                                <ul className="mt-3 space-y-1 text-center text-sm text-gray-600">
                                    {files.slice(0, 5).map((file) => (
                                        <li key={`${file.name}-${file.size}`} className="truncate">
                                            {file.name}
                                        </li>
                                    ))}
                                    {files.length > 5 ? (
                                        <li className="text-gray-500">
                                            + {files.length - 5} more
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
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={saving}
                className="inline-flex rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
                {saving ? "Uploading..." : "Add photos"}
            </button>
        </form>
    );
}