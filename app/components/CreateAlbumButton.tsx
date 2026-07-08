"use client";

import { useEffect, useRef, useState } from "react";
import AddAlbumForm from "./AddAlbumForm";

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

export default function CreateAlbumButton({
    albums = [],
    fixedParent,
    iconOnly = true,
    locale,
}: Props) {
    const [open, setOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
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
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Create album"
                title="Create album"
                className={
                    iconOnly
                        ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                        : "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                }
            >
                <span aria-hidden="true">＋</span>
                {!iconOnly ? <span>Create</span> : null}
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
                    onClick={() => setOpen(false)}
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
                                        Create album
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-600">
                                        Add a new album to your collection.
                                    </p>
                                </div>

                                <button
                                    ref={closeButtonRef}
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close modal"
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                                >
                                    <span aria-hidden="true">✕</span>
                                </button>
                            </div>

                            <div className="min-h-0 overflow-y-auto px-6 py-5">
                                <AddAlbumForm
                                    albums={albums}
                                    fixedParent={fixedParent}
                                    locale={locale}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}