"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
};

type DirectUploadResponse = {
    id: string;
    uploadURL: string;
};

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export default function AddAlbumForm({
    albums = [],
    fixedParent,
    locale,
}: Props) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [parentId, setParentId] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const effectiveParentId = fixedParent?.id ?? parentId;

    const generatedSlug = useMemo(() => slugify(name), [name]);

    const selectedParent = useMemo(() => {
        if (fixedParent) return fixedParent;
        return albums.find((album) => album.id === effectiveParentId);
    }, [albums, effectiveParentId, fixedParent]);

    const generatedPath = useMemo(() => {
        if (!generatedSlug) return "";
        return selectedParent ? `${selectedParent.path}/${generatedSlug}` : generatedSlug;
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

        if (!name.trim()) {
            setError("Album name is required.");
            return;
        }

        if (!coverFile) {
            setError("Cover image is required.");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const coverUpload = await uploadToCloudflare(coverFile);

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

            const albumId = albumData.album.id as string;
            const albumPath = albumData.album.path as string;

            for (const file of photoFiles) {
                const uploaded = await uploadToCloudflare(file);

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
                    throw new Error(photoData?.error || `Failed to save photo: ${file.name}`);
                }
            }

            router.refresh();
            router.push(`/${locale}/albums/${albumPath}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
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
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
                    placeholder="Summer wedding"
                    required
                />
            </div>

            {!fixedParent ? (
                <div>
                    <label htmlFor="parentId" className="mb-2 block text-sm font-medium text-gray-700">
                        Parent album
                    </label>
                    <select
                        id="parentId"
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        disabled={saving}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
                    >
                        <option value="">None</option>
                        {albums.map((album) => (
                            <option key={album.id} value={album.id}>
                                {album.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

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
                            {generatedPath || "Path preview will appear while you type the album name"}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Cover image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    disabled={saving}
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-700"
                    required
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Additional photos
                </label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={saving}
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                    className="block w-full text-sm text-gray-700"
                />
            </div>

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
                {saving ? "Saving..." : "Create album"}
            </button>
        </form>
    );
}