"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { useToast } from "@/app/components/Toast";

type Props = {
  albumId: string;
  albumName?: string;
  redirectTo?: string;
  className?: string;
  iconOnly?: boolean;
  hasSubalbums?: boolean;
  hasPhotos?: boolean;
};

const DeleteAlbumButton = ({
  albumId,
  albumName,
  redirectTo,
  className,
  iconOnly = false,
  hasSubalbums = false,
  hasPhotos = false,
}: Props) => {
  const t = useTranslations("admin");
  const router = useRouter();
  const confirm = useConfirm();
  const { showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const isBlocked = hasSubalbums || hasPhotos;
  const blockedReason = hasSubalbums
    ? t("album.deleteBlockedSubalbums")
    : t("album.deleteBlockedPhotos");

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBlocked) {
      showError(blockedReason);
      return;
    }

    const confirmed = await confirm({
      title: t("album.deleteAlbum"),
      message: t("album.deleteConfirmMessage", {
        name: albumName ? ` (${albumName})` : "",
      }),
      confirmLabel: t("common.delete"),
      danger: true,
    });

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("album.deleteFailed"));
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      showError(
        error instanceof Error ? error.message : t("album.deleteFailed"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-disabled={isBlocked}
      aria-label={
        hasSubalbums
          ? t("album.deleteAriaSubalbums")
          : hasPhotos
            ? t("album.deleteAriaPhotos")
            : t("album.deleteAlbum")
      }
      title={
        hasSubalbums
          ? t("album.deleteBlockedSubalbums")
          : hasPhotos
            ? t("album.deleteBlockedPhotos")
            : t("album.deleteAlbum")
      }
      className={
        className ??
        (iconOnly
          ? isBlocked
            ? "inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition"
            : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          : isBlocked
            ? "cursor-not-allowed rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition"
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
        t("common.deleting")
      ) : (
        t("album.deleteAlbum")
      )}
    </button>
  );
};

export default DeleteAlbumButton;
