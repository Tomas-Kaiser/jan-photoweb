"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type AlbumOption = {
    id: string;
    name: string;
    path: string;
};

type AlbumPlacement = "root" | "child";

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/--+/g, "-");
}

export default function AddAlbumForm() {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [placement, setPlacement] = useState<AlbumPlacement>("root");
    const [albums, setAlbums] = useState<AlbumOption[]>([]);
    const [parentId, setParentId] = useState("");
    const [name, setName] = useState("");
    const [objectPosition, setObjectPosition] = useState("center");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingAlbums, setLoadingAlbums] = useState(true);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState("");

    const slug = useMemo(() => slugify(name), [name]);

    const selectedParent = useMemo(
        () => albums.find((album) => album.id === parentId) ?? null,
        [albums, parentId]
    );

    const generatedPath = useMemo(() => {
        if (!slug) return "";
        if (placement === "child" && selectedParent) {
            return `${selectedParent.path}/${slug}`;
        }
        return slug;
    }, [slug, placement, selectedParent]);

    useEffect(() => {
        let ignore = false;

        async function loadAlbums() {
            try {
                setLoadingAlbums(true);
                const res = await fetch("/api/admin/albums", { method: "GET" });

                if (!res.ok) {
                    throw new Error("Failed to load albums");
                }

                const data = (await res.json()) as { albums: AlbumOption[] };

                if (!ignore) {
                    setAlbums(data.albums ?? []);
                }
            } catch (error) {
                if (!ignore) {
                    setMessage(
                        error instanceof Error ? error.message : "Failed to load albums."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoadingAlbums(false);
                }
            }
        }

        loadAlbums();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (!coverFile) {
            setPreviewUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(coverFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [coverFile]);

    const openPicker = () => {
        inputRef.current?.click();
    };

    async function uploadCoverImage(file: File) {
        const uploadUrlRes = await fetch("/api/admin/photos/upload-url", {
            method: "POST",
        });

        if (!uploadUrlRes.ok) {
            throw new Error("Failed to create cover upload URL");
        }

        const { id, uploadURL } = await uploadUrlRes.json();

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(uploadURL, {
            method: "POST",
            body: formData,
        });

        if (!uploadRes.ok) {
            throw new Error("Failed to upload cover image");
        }

        const DELIVERY_BASE = "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg";
        return `${DELIVERY_BASE}/${id}/public`;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!coverFile) {
            setMessage("Please choose a cover image.");
            return;
        }

        if (!name.trim()) {
            setMessage("Album name is required.");
            return;
        }

        const finalSlug = slugify(name);

        if (!finalSlug) {
            setMessage("Album name must contain letters or numbers.");
            return;
        }

        if (placement === "child" && !parentId) {
            setMessage("Please choose a parent album.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setProgress("Uploading cover image...");

            const coverUrl = await uploadCoverImage(coverFile);

            setProgress("Creating album...");

            const res = await fetch("/api/admin/albums", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    slug: finalSlug,
                    parentId: placement === "child" ? parentId : null,
                    coverUrl,
                    objectPosition,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.error || "Failed to create album");
            }

            setMessage("Album created successfully.");
            setProgress("");
            setName("");
            setParentId("");
            setObjectPosition("center");
            setCoverFile(null);
            setPlacement("root");

            if (inputRef.current) {
                inputRef.current.value = "";
            }
        } catch (error) {
            setProgress("");
            setMessage(
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4">
            <form
                onSubmit={handleSubmit}
                className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
            >
                <div className="mb-8">
                    <h3 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-950">
                        Create album
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500">
                        Create a root album or nest a new album inside an existing one.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="mb-3 block text-sm font-medium text-neutral-700">
                        Album placement
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => {
                                setPlacement("root");
                                setParentId("");
                            }}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${placement === "root"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500"
                                }`}
                        >
                            <div className="text-sm font-semibold">Root album</div>
                            <div
                                className={`mt-1 text-sm ${placement === "root" ? "text-neutral-200" : "text-neutral-500"
                                    }`}
                            >
                                /albums/your-album
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPlacement("child")}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${placement === "child"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500"
                                }`}
                        >
                            <div className="text-sm font-semibold">Child album</div>
                            <div
                                className={`mt-1 text-sm ${placement === "child" ? "text-neutral-200" : "text-neutral-500"
                                    }`}
                            >
                                /albums/parent/your-album
                            </div>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">
                                Album name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Still in Style"
                                className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200"
                                required
                            />
                        </div>

                        {placement === "child" ? (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Parent album
                                </label>
                                <select
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                    disabled={loadingAlbums || loading}
                                    className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200"
                                    required
                                >
                                    <option value="">
                                        {loadingAlbums ? "Loading albums..." : "Select parent album"}
                                    </option>
                                    {albums.map((album) => (
                                        <option key={album.id} value={album.id}>
                                            {album.path}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                                Generated values
                            </p>

                            <div className="mt-3 space-y-3">
                                <div>
                                    <p className="text-xs text-neutral-500">Slug</p>
                                    <p className="break-all text-sm font-medium text-neutral-900">
                                        {slug || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-neutral-500">Album path</p>
                                    <p className="break-all text-sm font-medium text-neutral-900">
                                        {generatedPath || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-neutral-500">Route</p>
                                    <p className="break-all text-sm font-medium text-neutral-900">
                                        {generatedPath ? `/albums/${generatedPath}` : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">
                                Cover image position
                            </label>
                            <select
                                value={objectPosition}
                                onChange={(e) => setObjectPosition(e.target.value)}
                                className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200"
                            >
                                <option value="center">center</option>
                                <option value="top15">top15</option>
                                <option value="top30">top30</option>
                                <option value="top">top</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">
                                Cover image
                            </label>

                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={openPicker}
                                disabled={loading}
                                className="flex min-h-[120px] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center transition hover:border-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <div>
                                    <div className="text-base font-medium text-neutral-900">
                                        {coverFile ? "Change cover image" : "Choose cover image"}
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-500">
                                        JPG, PNG, or WebP
                                    </div>
                                </div>
                            </button>

                            <div className="mt-3 text-sm text-neutral-600">
                                {coverFile ? coverFile.name : "No cover image selected"}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-50">
                            <div className="border-b border-neutral-200 px-4 py-3">
                                <p className="text-sm font-medium text-neutral-800">
                                    Cover preview
                                </p>
                            </div>

                            <div className="relative flex aspect-[4/5] items-center justify-center bg-neutral-100">
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt="Cover preview"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="px-6 text-center text-sm text-neutral-400">
                                        Select a cover image to preview it here.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {progress ? (
                    <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                        {progress}
                    </div>
                ) : null}

                {message ? (
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                        {message}
                    </div>
                ) : null}

                <div className="mt-8 flex items-center justify-end border-t border-neutral-200 pt-6">
                    <button
                        type="submit"
                        disabled={loading || loadingAlbums}
                        className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create album"}
                    </button>
                </div>
            </form>
        </div>
    );
}