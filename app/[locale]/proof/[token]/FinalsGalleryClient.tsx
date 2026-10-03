"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { useToast } from "@/app/components/Toast";
import Reveal from "./Reveal";

type Photo = {
  id: string;
  fileName: string;
  cardSrc: string;
  detailSrc: string;
};

type Props = {
  token: string;
  photos: Photo[];
};

export default function FinalsGalleryClient({ token, photos }: Props) {
  const t = useTranslations("finalDelivery");
  const toast = useToast();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const slides = photos.map((photo) => ({ src: photo.detailSrc }));
  const lightboxPhoto =
    lightboxIndex !== null ? photos[lightboxIndex] : undefined;

  async function downloadPhoto(photo: Photo) {
    setDownloadingId(photo.id);

    try {
      const res = await fetch(
        `/api/proof/${token}/final-photos/${photo.id}/download-url`,
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("downloadFailed"));
      }

      window.location.href = data.url;
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t("downloadFailed"));
    } finally {
      setDownloadingId(null);
    }
  }

  async function downloadAll() {
    setDownloadingAll(true);

    try {
      const res = await fetch(`/api/proof/${token}/final-photos/download-all`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || t("downloadFailed"));
      }

      const zipRes = await fetch(data.workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: data.galleryId,
          expires: data.expires,
          sig: data.sig,
          files: data.files,
        }),
      });

      if (!zipRes.ok) {
        throw new Error(t("downloadFailed"));
      }

      const blob = await zipRes.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "photos.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t("downloadFailed"));
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <div>
      <Reveal as="header" className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-brand-green sm:text-6xl">
          {t("heading")}
        </h1>
        <div className="mt-7 h-px w-20 bg-brand-gold" />
        <p className="mt-5 text-lg leading-8 text-gray-600">{t("instructions")}</p>
      </Reveal>

      <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-4" delay={60}>
        <p className="text-sm font-medium text-brand-green/70">
          {t("photoCount", { count: photos.length })}
        </p>
        <button
          type="button"
          onClick={downloadAll}
          disabled={downloadingAll}
          className="rounded-full bg-brand-green px-7 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloadingAll ? t("downloadingAll") : t("downloadAllButton")}
        </button>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <Reveal key={photo.id} delay={(index % 4) * 70}>
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.25)] ring-2 ring-brand-green ring-offset-2 ring-offset-brand-cream"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="absolute inset-0"
              >
                <Image
                  src={photo.cardSrc}
                  alt={photo.fileName}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Blocks right-click/save on the lightbox's zoomed preview — a
          deterrent, not real DRM. React portals still bubble synthetic
          events through this wrapper even though the lightbox renders into
          a portal outside this DOM subtree. The actual full-quality
          original is never exposed here regardless, since this view only
          ever renders the Cloudflare Images preview. */}
      <div onContextMenu={(e) => e.preventDefault()}>
        <Lightbox
          open={lightboxIndex !== null}
          close={() => setLightboxIndex(null)}
          slides={slides}
          index={lightboxIndex ?? 0}
          on={{ view: ({ index }) => setLightboxIndex(index) }}
          render={{
            controls: () =>
              lightboxPhoto ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                  <div className="pointer-events-auto inline-flex overflow-hidden rounded-full border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
                    <button
                      type="button"
                      onClick={() => downloadPhoto(lightboxPhoto)}
                      disabled={downloadingId === lightboxPhoto.id}
                      className="bg-brand-green/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-green disabled:opacity-60"
                    >
                      {downloadingId === lightboxPhoto.id
                        ? t("downloadingAll")
                        : t("downloadButton")}
                    </button>
                  </div>
                </div>
              ) : null,
          }}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 1.2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            keyboardMoveDistance: 50,
          }}
        />
      </div>
    </div>
  );
}
