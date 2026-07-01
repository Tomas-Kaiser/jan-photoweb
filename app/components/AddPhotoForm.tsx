"use client";

import { useRef, useState } from "react";

type Props = {
    albumId: string;
};

export default function AddPhotoForm({ albumId }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState("");

    const openPicker = () => {
        inputRef.current?.click();
    };

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files ?? []);
        setFiles(selectedFiles);
        setMessage("");
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!files.length) {
            setMessage("Please choose at least one photo.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setProgress("");

            const DELIVERY_BASE = "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg";

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

                const uploadUrlRes = await fetch("/api/admin/photos/upload-url", {
                    method: "POST",
                });

                if (!uploadUrlRes.ok) {
                    throw new Error("Failed to create upload URL");
                }

                const { id, uploadURL } = await uploadUrlRes.json();

                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch(uploadURL, {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                const cloudflareUrl = `${DELIVERY_BASE}/${id}/public`;
                const photoName = file.name.replace(/\.[^/.]+$/, "");

                const saveRes = await fetch("/api/admin/photos", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        albumId,
                        name: photoName,
                        cloudflareUrl,
                    }),
                });

                if (!saveRes.ok) {
                    throw new Error(`Failed to save ${file.name}`);
                }
            }

            setMessage(`Successfully uploaded ${files.length} photo${files.length > 1 ? "s" : ""}.`);
            setFiles([]);
            setProgress("");

            if (inputRef.current) {
                inputRef.current.value = "";
            }

            window.location.reload();
        } catch {
            setProgress("");
            setMessage("Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4">
            <form
                onSubmit={handleSubmit}
                className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
            >
                <div className="mb-8">
                    <h3 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-950">
                        Add photos
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500">
                        Upload one or more images to this album. New photos appear first automatically.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-700">
                            Photo files
                        </label>

                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFilesChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={openPicker}
                            disabled={loading}
                            className="flex min-h-[140px] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center transition hover:border-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <div>
                                <div className="text-base font-medium text-neutral-900">
                                    {files.length ? "Change selected photos" : "Choose photos"}
                                </div>
                                <div className="mt-1 text-sm text-neutral-500">
                                    Select one or more JPG, PNG, or WebP files
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        {files.length ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-neutral-800">
                                    {files.length} file{files.length > 1 ? "s" : ""} selected
                                </p>
                                <ul className="max-h-48 space-y-1 overflow-auto text-sm text-neutral-600">
                                    {files.map((file, index) => (
                                        <li key={`${file.name}-${index}`} className="truncate">
                                            {file.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500">No files selected.</p>
                        )}
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

                    <div className="flex flex-col gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-neutral-500">
                            Each file is saved as a separate photo entry.
                        </p>

                        <button
                            type="submit"
                            disabled={loading || !files.length}
                            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Uploading..." : `Upload${files.length ? ` ${files.length}` : ""} photo${files.length === 1 ? "" : "s"}`}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}