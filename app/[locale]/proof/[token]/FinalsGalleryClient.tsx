"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { useToast } from "@/app/components/Toast";
import { useHideProofChrome } from "../../ProofChromeContext";
import Reveal from "./Reveal";

type Photo = {
  id: string;
  fileName: string;
  gridSrc: string;
  detailSrc: string;
  fullSrc: string;
  width: number;
  height: number;
};

type Props = {
  token: string;
  clientName: string;
  message: string | null;
  photos: Photo[];
};

export default function FinalsGalleryClient({
  token,
  clientName,
  message,
  photos,
}: Props) {
  const t = useTranslations("finalDelivery");
  const toast = useToast();
  useHideProofChrome(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const hero = photos[0];
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
      {hero ? (
        <>
          {/* Fixed in place behind everything — the content wrapper below
              has its own opaque background and a higher z-index, so it
              scrolls up over this like a reveal instead of this scrolling
              away with the rest of the page. Deliberately z-0, not a
              negative z-index: this div has no `position` of its own, so a
              negative value would paint behind its own background, hiding
              the hero entirely. */}
          <section
            onContextMenu={(e) => e.preventDefault()}
            className="fixed inset-0 z-0 h-dvh w-full overflow-hidden"
          >
            <Image
              src={hero.fullSrc}
              alt={hero.fileName}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_22%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            <div className="absolute inset-x-0 bottom-0 px-6 pb-16 sm:px-10 sm:pb-20">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                {clientName}
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-white sm:text-6xl">
                {t("heading")}
              </h1>
            </div>

            <div className="absolute inset-x-0 bottom-6 flex justify-center motion-safe:animate-bounce">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-6 w-6 text-white/80"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </section>

          {/* Spacer holding the fixed hero's place in normal document
              flow, so the content below starts one viewport-height down. */}
          <div className="h-dvh w-full" aria-hidden="true" />
        </>
      ) : null}

      <div className="relative z-10 bg-brand-cream">
        <div className="sticky top-0 z-30 border-b border-brand-gold/15 bg-brand-cream/95 shadow-[0_4px_20px_-8px_rgba(1,68,33,0.2)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
            <span className="font-display text-lg font-semibold text-brand-green">
              {clientName}
            </span>
            <button
              type="button"
              onClick={downloadAll}
              disabled={downloadingAll}
              className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingAll ? t("downloadingAll") : t("downloadAllButton")}
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:py-20">
          <noscript>
            <style>
              {".reveal{opacity:1!important;transform:none!important}"}
            </style>
          </noscript>

          <Reveal as="header" className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-brand-green sm:text-4xl">
              {t("heading")}
            </h2>
            <div className="mt-5 h-px w-20 bg-brand-gold" />
            <p className="mt-5 text-lg leading-8 text-gray-600">{t("instructions")}</p>
          </Reveal>

          {message ? (
            <Reveal className="mt-8 flex items-end gap-3" delay={60}>
              <Image
                src="/jan-avatar.jpg"
                alt="Jan Hájek"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-brand-gold/20"
              />
              <div className="relative max-w-md rounded-2xl rounded-bl-sm bg-white p-4 shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)]">
                <p className="whitespace-pre-wrap text-gray-700">{message}</p>
              </div>
            </Reveal>
          ) : null}

          <Reveal
            className="mt-10 text-sm font-medium text-brand-green/70"
            delay={100}
          >
            {t("photoCount", { count: photos.length })}
          </Reveal>

          <div className="mt-6">
            <RowsPhotoAlbum
              photos={photos.map((photo) => ({
                key: photo.id,
                src: photo.gridSrc,
                width: photo.width,
                height: photo.height,
                alt: photo.fileName,
              }))}
              targetRowHeight={260}
              spacing={8}
              onClick={({ index }) => setLightboxIndex(index)}
              render={{
                photo: (props, { photo, index, width, height }) => (
                  <Reveal delay={(index % 6) * 50}>
                    <div
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ width, height }}
                      className="group relative overflow-hidden rounded-lg bg-gray-100 transition duration-200 motion-safe:hover:opacity-90"
                    >
                      <button
                        type="button"
                        onClick={props.onClick}
                        className="absolute inset-0"
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt ?? ""}
                          fill
                          sizes={`${width}px`}
                          className="object-cover"
                        />
                      </button>
                    </div>
                  </Reveal>
                ),
              }}
            />
          </div>
        </div>
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
