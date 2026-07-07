"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    albumId: string;
    albumName?: string;
    redirectTo?: string;
    className?: string;
    iconOnly?: boolean;
};

const DeleteAlbumButton = ({
    albumId,
    albumName,
    redirectTo,
    className,
    iconOnly = false,
}: Props) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const confirmed = window.confirm(
            `Delete this album${albumName ? ` (${albumName})` : ""}? This will fail if it still has subalbums.`
        );

        if (!confirmed) return;

        try {
            setIsDeleting(true);

            const res = await fetch(`/api/admin/albums/${albumId}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Failed to delete album");
            }

            if (redirectTo) {
                router.push(redirectTo);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to delete album");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete album"
            title="Delete album"
            className={
                className ??
                (iconOnly
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    : "rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60")
            }
        >
            {iconOnly ? (
                isDeleting ? (
                    <span className="text-xs">...</span>
                ) : (
                    <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                    >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                    </svg>
                )
            ) : isDeleting ? (
                "Deleting..."
            ) : (
                "Delete album"
            )}
        </button>
    );
};

export default DeleteAlbumButton;