"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AlbumOption = {
    name: string;
    slug: string;
};

type AlbumMode = "top-level" | "nested";

interface AddAlbumCardProps {
    categories?: AlbumOption[];
}

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

export default function AddAlbumCard({ categories }: AddAlbumCardProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const safeCategories = useMemo(() => categories ?? [], [categories]);
    const hasParents = safeCategories.length > 0;

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState("");

    const [mode, setMode] = useState<AlbumMode>("top-level");
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [parentSlug, setParentSlug] = useState("");
    const [objectPosition, setObjectPosition] = useState("center");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        const firstParent = safeCategories[0];
        if (!parentSlug && firstParent) {
            setParentSlug(firstParent.slug);
        }
    }, [safeCategories, parentSlug]);

    useEffect(() => {
        if (!hasParents && mode === "nested") {
            setMode("top-level");
        }
    }, [hasParents, mode]);

    useEffect(() => {
        if (!coverFile) {
            setPreviewUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(coverFile);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [coverFile]);

    const slug = useMemo(() => slugify(name), [name]);
    const brandSlug = useMemo(() => slugify(brand), [brand]);

    const selectedParent = safeCategories.find((item) => item.slug === parentSlug);

    const generatedLink = useMemo(() => {
        if (!slug) return "";

        if (mode === "top-level") {
            return brandSlug
                ? `/albums/${slug}/${brandSlug}/${slug}`
                : `/albums/${slug}/${slug}`;
        }

        if (!parentSlug) return "";

        return brandSlug
            ? `/albums/${parentSlug}/${brandSlug}/${slug}`
            : `/albums/${parentSlug}/${slug}`;
    }, [slug, mode, parentSlug, brandSlug]);

    const openPicker = () => {
        inputRef.current?.click();
    };

    const closeModal = () => {
        setOpen(false);
        setLoading(false);
        setMessage("");
        setProgress("");
        setMode("top-level");
        setName("");
        setBrand("");
        setParentSlug(safeCategories[0]?.slug ?? "");
        setObjectPosition("center");
        setCoverFile(null);
        setPreviewUrl("");

        if (inputRef.current) {
            inputRef.current.value = "";
        }
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

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const finalSlug = slugify(name);
        const finalBrandSlug = slugify(brand);

        if (!name.trim()) {
            setMessage("Album name is required.");
            return;
        }

        if (!finalSlug) {
            setMessage("Album name must contain letters or numbers.");
            return;
        }

        if (mode === "nested" && !parentSlug) {
            setMessage("Please choose a parent album.");
            return;
        }

        if (!coverFile) {
            setMessage("Please choose a cover image.");
            return;
        }

        const finalLink =
            mode === "top-level"
                ? finalBrandSlug
                    ? `/albums/${finalSlug}/${finalBrandSlug}/${finalSlug}`
                    : `/albums/${finalSlug}/${finalSlug}`
                : finalBrandSlug
                    ? `/albums/${parentSlug}/${finalBrandSlug}/${finalSlug}`
                    : `/albums/${parentSlug}/${finalSlug}`;

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
                    parentSlug: mode === "nested" ? parentSlug : null,
                    brand: brand.trim() || null,
                    brandSlug: finalBrandSlug || null,
                    coverUrl,
                    link: finalLink,
                    objectPosition,
                    mode,
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || "Failed to create album");
            }

            closeModal();
            router.push(finalLink);
            router.refresh();
        } catch (error) {
            setProgress("");
            setMessage(
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
            setProgress("");
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group flex h-[110px] w-[110px] items-start justify-start rounded-[20px] border border-dashed border-neutral-300 bg-white p-3 transition hover:border-neutral-500 hover:bg-neutral-50"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-lg leading-none text-neutral-700 transition group-hover:border-neutral-500">
                    +
                </div>
            </button>

            {open ? (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
                    <div className="flex min-h-full items-start justify-center p-4 md:p-8">
                        <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5 md:px-8">
                                <div>
                                    <h3 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-950">
                                        Create album
                                    </h3>
                                    <p className="mt-2 text-sm text-neutral-500">
                                        Create a top-level album or nest one under an existing album.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div>
                                        <label className="mb-3 block text-sm font-medium text-neutral-700">
                                            Album type
                                        </label>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() => setMode("top-level")}
                                                className={`rounded-2xl border px-4 py-4 text-left transition ${mode === "top-level"
                                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                                    : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500"
                                                    }`}
                                            >
                                                <div className="text-sm font-semibold">Top level</div>
                                                <div
                                                    className={`mt-1 text-sm ${mode === "top-level"
                                                        ? "text-neutral-200"
                                                        : "text-neutral-500"
                                                        }`}
                                                >
                                                    Creates a new top-level album
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setMode("nested")}
                                                disabled={!hasParents}
                                                className={`rounded-2xl border px-4 py-4 text-left transition ${mode === "nested"
                                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                                    : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500"
                                                    } ${!hasParents ? "cursor-not-allowed opacity-50 hover:border-neutral-300" : ""}`}
                                            >
                                                <div className="text-sm font-semibold">Nested</div>
                                                <div
                                                    className={`mt-1 text-sm ${mode === "nested"
                                                        ? "text-neutral-200"
                                                        : "text-neutral-500"
                                                        }`}
                                                >
                                                    {hasParents
                                                        ? "Creates an album under an existing album"
                                                        : "Create a top-level album first"}
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {mode === "nested" ? (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-neutral-700">
                                                Parent album
                                            </label>
                                            <select
                                                value={parentSlug}
                                                onChange={(e) => setParentSlug(e.target.value)}
                                                className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200"
                                                required
                                            >
                                                <option value="">Select parent album</option>
                                                {safeCategories.map((album) => (
                                                    <option key={album.slug} value={album.slug}>
                                                        {album.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : null}

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

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-neutral-700">
                                            Brand (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            placeholder="Janine Made by Love"
                                            className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200"
                                        />
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
                                            <option value="top">top</option>
                                            <option value="top15">top15</option>
                                            <option value="top30">top30</option>
                                        </select>
                                    </div>

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
                                            className="flex min-h-[96px] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-6 text-center transition hover:border-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
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

                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                                            Preview
                                        </p>

                                        <div className="mt-3 space-y-3">
                                            <div>
                                                <p className="text-xs text-neutral-500">Slug</p>
                                                <p className="break-all text-sm font-medium text-neutral-900">
                                                    {slug || "—"}
                                                </p>
                                            </div>

                                            {mode === "nested" ? (
                                                <div>
                                                    <p className="text-xs text-neutral-500">Parent album</p>
                                                    <p className="break-all text-sm font-medium text-neutral-900">
                                                        {selectedParent?.name || "—"}
                                                    </p>
                                                </div>
                                            ) : null}

                                            {brand ? (
                                                <div>
                                                    <p className="text-xs text-neutral-500">Brand slug</p>
                                                    <p className="break-all text-sm font-medium text-neutral-900">
                                                        {brandSlug || "—"}
                                                    </p>
                                                </div>
                                            ) : null}

                                            <div>
                                                <p className="text-xs text-neutral-500">Link</p>
                                                <p className="break-all text-sm font-medium text-neutral-900">
                                                    {generatedLink || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {progress ? (
                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                                            {progress}
                                        </div>
                                    ) : null}

                                    {message ? (
                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                                            {message}
                                        </div>
                                    ) : null}

                                    <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading ? "Creating..." : "Create album"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}