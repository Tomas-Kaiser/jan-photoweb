"use client";

import { useState } from "react";

type Props = {
    albumId: string;
    initialName: string;
    initialSlug: string;
};

export default function EditAlbumButton({
    albumId,
    initialName,
    initialSlug,
}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [slug, setSlug] = useState(initialSlug);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!name.trim()) {
            setMessage("Album name is required.");
            return;
        }

        if (!slug.trim()) {
            setMessage("Slug is required.");
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
                    name: name.trim(),
                    slug: slug.trim(),
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || "Failed to update album.");
            }

            setMessage("Album updated.");
            window.location.href = `/albums/${data.path}`;
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mt-3 flex flex-col items-center gap-3">
            {!isEditing ? (
                <button
                    type="button"
                    onClick={() => {
                        setIsEditing(true);
                        setMessage("");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                >
                    <span aria-hidden="true">✏️</span>
                    Edit album
                </button>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <label className="mb-2 block text-left text-sm font-medium text-gray-700">
                        Album name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={saving}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200"
                        required
                    />

                    <label className="mb-2 mt-4 block text-left text-sm font-medium text-gray-700">
                        Slug
                    </label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        disabled={saving}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200"
                        required
                    />

                    <p className="mt-3 text-left text-xs text-gray-500">
                        Changing the slug updates this album URL and all subalbum paths.
                    </p>

                    <div className="mt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setName(initialName);
                                setSlug(initialSlug);
                                setMessage("");
                            }}
                            disabled={saving}
                            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>

                    {message ? (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            {message}
                        </div>
                    ) : null}
                </form>
            )}
        </div>
    );
}