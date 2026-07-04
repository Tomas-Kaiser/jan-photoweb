"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    albumId: string;
    albumName?: string;
    redirectTo?: string;
    className?: string;
};

const DeleteAlbumButton = ({
    albumId,
    albumName,
    redirectTo,
    className,
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
            className={
                className ??
                "rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            }
        >
            {isDeleting ? "Deleting..." : "Delete album"}
        </button>
    );
};

export default DeleteAlbumButton;