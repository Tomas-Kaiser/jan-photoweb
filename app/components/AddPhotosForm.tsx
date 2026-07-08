"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    album: {
        id: string;
        name: string;
        path: string;
    };
};

type DirectUploadResponse = {
    id: string;
    uploadURL: string;
};

export default function AddPhotosForm({ album }: Props) {
    const router = useRouter();

    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        formData.append("file", file);

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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!photoFiles.length) {
            setError("Please select at least one photo.");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            for (const file of photoFiles) {
                const uploaded = await uploadToCloudflare(file);

                const photoRes = await fetch("/api/admin/photos", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        albumId: album.id,
                        name: uploaded.name,
                        cloudflareId: uploaded.cloudflareId,
                    }),
                });

                const photoData = await photoRes.json().catch(() => null);

                if (!photoRes.ok) {
                    throw new Error(photoData?.error || `Failed to save photo: ${file.name}`);
                }
            }

            router.refresh();
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Album
                </label>
                <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    {album.name}
                </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Photos
                </label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={saving}
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                    className="block w-full text-sm text-gray-700"
                />
                <p className="mt-1 text-sm text-gray-500">
                    Select one or more photos.
                </p>
            </div>

            {photoFiles.length > 0 ? (
                <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {photoFiles.length} photo{photoFiles.length > 1 ? "s" : ""} selected
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