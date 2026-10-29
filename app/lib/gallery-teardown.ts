// Where a gallery's assets live. The real adapter (app/lib/asset-store.ts)
// talks to R2 and Cloudflare Images; tests use an in-memory one. Both treat
// deleting something that's already gone as success.
export type AssetStore = {
  deleteR2Object(key: string): Promise<void>;
  deleteCloudflareImage(cloudflareId: string): Promise<void>;
};

export type FinalPhotoAssets = {
  r2Key: string;
  previewCloudflareId: string;
};

// What a failed upload may have left behind: the preview always exists, the
// R2 original only if the upload got as far as an R2 key.
export type PartialFinalPhotoAssets = {
  r2Key?: string;
  previewCloudflareId: string;
};

export type GalleryAssets = {
  heroMobileCloudflareId: string | null;
  heroDesktopCloudflareId: string | null;
  proofCloudflareIds: string[];
  finals: FinalPhotoAssets[];
};

export type AssetKind = "hero" | "proof" | "final original" | "final preview";

// Thrown when R2 or Cloudflare refuses a delete — callers report it as an
// upstream (502) failure, distinct from a database error.
export class AssetDeletionError extends Error {
  constructor(
    readonly kind: AssetKind,
    readonly assetId: string,
    options: { cause: unknown },
  ) {
    super(`Failed to delete ${kind} asset ${assetId}`, options);
    this.name = "AssetDeletionError";
  }
}

async function deleteAsset(
  kind: AssetKind,
  assetId: string,
  remove: () => Promise<void>,
) {
  try {
    await remove();
  } catch (cause) {
    throw new AssetDeletionError(kind, assetId, { cause });
  }
}

// The one teardown behind both manual "Delete gallery" and the retention
// cron: deletes every asset the gallery owns, then the row (which cascades
// proof photos, orders and final photos). Any asset failure throws before
// the row is touched, so the gallery stays listed and can be retried.
export async function tearDownGallery(
  store: AssetStore,
  gallery: GalleryAssets,
  deleteRow: () => Promise<void>,
) {
  for (const cloudflareId of [
    gallery.heroMobileCloudflareId,
    gallery.heroDesktopCloudflareId,
  ]) {
    if (cloudflareId) {
      await deleteAsset("hero", cloudflareId, () =>
        store.deleteCloudflareImage(cloudflareId),
      );
    }
  }

  for (const cloudflareId of gallery.proofCloudflareIds) {
    await deleteAsset("proof", cloudflareId, () =>
      store.deleteCloudflareImage(cloudflareId),
    );
  }

  for (const photo of gallery.finals) {
    await deleteFinalPhotoAssets(store, photo);
  }

  await deleteRow();
}

// Deletes one final photo's R2 original and Cloudflare preview. Used by
// gallery teardown, by the admin's single-final delete (which removes the
// row itself afterwards), and to discard a failed upload, which may not
// have reached R2.
export async function deleteFinalPhotoAssets(
  store: AssetStore,
  photo: FinalPhotoAssets | PartialFinalPhotoAssets,
) {
  const { r2Key, previewCloudflareId } = photo;

  if (r2Key) {
    await deleteAsset("final original", r2Key, () => store.deleteR2Object(r2Key));
  }
  await deleteAsset("final preview", previewCloudflareId, () =>
    store.deleteCloudflareImage(previewCloudflareId),
  );
}
