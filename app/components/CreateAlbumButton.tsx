"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddAlbumForm from "./AddAlbumForm";
import AddPhotosForm from "./AddPhotosForm";

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
    canAddPhotosToCurrentAlbum?: boolean;
    iconOnly?: boolean;
    locale: string;
};

type Mode = "album" | "photos";

export default function CreateAlbumButton({
    albums = [],
    fixedParent,
    canAddPhotosToCurrentAlbum = false,
    iconOnly = true,
    locale,
}: Props) {
    const [open, setOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const defaultMode: Mode = useMemo(() => {
        if (fixedParent && canAddPhotosToCurrentAlbum) return "photos";
        return "album";
    }, [fixedParent, canAddPhotosToCurrentAlbum]);

    const [mode, setMode] = useState<Mode>(defaultMode);

    const handleOpen = useCallback(() => {
        setMode(defaultMode);
        setOpen(true);
    }, [defaultMode]);

    const handleClose = useCallback(() => {
        setOpen(false);
        setMode(defaultMode);
    }, [defaultMode]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") handleClose();
        }

        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
            closeButtonRef.current?.focus();
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, handleClose]);

    const canShowPhotoMode = !!fixedParent && canAddPhotosToCurrentAlbum;

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                aria-label="Create album or add photos"
                title="Create album or add photos"
                className={
                    iconOnly
                        ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                        : "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                }
            >
                <span aria-hidden="true">＋</span>
                {!iconOnly ? <span>Add</span> : null}
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
                    onClick={handleClose}
                >
                    <div className="flex min-h-full items-center justify-center">
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="create-modal-title"
                            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
                                <div className="w-full">
                                    <h3
                                        id="create-modal-title"
                                        className="text-xl font-bold text-gray-900"
                                    >
                                        {mode === "album" ? "Create album" : "Add photos"}
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-600">
                                        {mode === "album"
                                            ? "Create a new album and optionally upload photos into it."
                                            : "Upload photos directly into this album."}
                                    </p>
                                </div>

                                <button
                                    ref={closeButtonRef}
                                    type="button"
                                    onClick={handleClose}
                                    aria-label="Close modal"
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                                >
                                    <span aria-hidden="true">✕</span>
                                </button>
                            </div>

                            <div className="min-h-0 overflow-y-auto px-6 py-5">
                                {canShowPhotoMode ? (
                                    <fieldset className="mb-6">
                                        <legend className="mb-3 text-sm font-medium text-gray-900">
                                            Choose action
                                        </legend>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-400">
                                                <input
                                                    type="radio"
                                                    name="create-mode"
                                                    value="album"
                                                    checked={mode === "album"}
                                                    onChange={() => setMode("album")}
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <span className="block text-sm font-semibold text-gray-900">
                                                        Create new album
                                                    </span>
                                                    <span className="mt-1 block text-sm text-gray-600">
                                                        Add a child album under this album, with a cover and optional photos.
                                                    </span>
                                                </span>
                                            </label>

                                            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-400">
                                                <input
                                                    type="radio"
                                                    name="create-mode"
                                                    value="photos"
                                                    checked={mode === "photos"}
                                                    onChange={() => setMode("photos")}
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <span className="block text-sm font-semibold text-gray-900">
                                                        Add photos only
                                                    </span>
                                                    <span className="mt-1 block text-sm text-gray-600">
                                                        Upload photos directly into the current album without creating a new one.
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    </fieldset>
                                ) : null}

                                {mode === "album" ? (
                                    <AddAlbumForm
                                        albums={albums}
                                        fixedParent={fixedParent}
                                        locale={locale}
                                    />
                                ) : fixedParent ? (
                                    <AddPhotosForm
                                        album={{
                                            id: fixedParent.id,
                                            name: fixedParent.name,
                                            path: fixedParent.path,
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}