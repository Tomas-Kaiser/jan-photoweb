import { describe, expect, it } from "vitest";
import {
  AssetDeletionError,
  type AssetStore,
  deleteFinalPhotoAssets,
  tearDownGallery,
} from "@/app/lib/gallery-teardown";

// In-memory stand-in for R2 + Cloudflare Images. Like the real adapters,
// deleting something that's already gone succeeds; ids in `failing` throw.
function createInMemoryAssetStore(
  initial: { r2Keys?: string[]; cloudflareIds?: string[] },
  failing: string[] = [],
) {
  const r2Keys = new Set(initial.r2Keys);
  const cloudflareIds = new Set(initial.cloudflareIds);

  const store: AssetStore = {
    async deleteR2Object(key) {
      if (failing.includes(key)) throw new Error(`R2 delete failed: ${key}`);
      r2Keys.delete(key);
    },
    async deleteCloudflareImage(id) {
      if (failing.includes(id)) throw new Error(`Cloudflare delete failed: ${id}`);
      cloudflareIds.delete(id);
    },
  };

  return { store, r2Keys, cloudflareIds };
}

const gallery = {
  heroMobileCloudflareId: "hero-mobile",
  heroDesktopCloudflareId: "hero-desktop",
  proofCloudflareIds: ["proof-1", "proof-2"],
  finals: [
    { r2Key: "finals/1.jpg", previewCloudflareId: "preview-1" },
    { r2Key: "finals/2.jpg", previewCloudflareId: "preview-2" },
  ],
};

const allAssets = {
  r2Keys: ["finals/1.jpg", "finals/2.jpg"],
  cloudflareIds: [
    "hero-mobile",
    "hero-desktop",
    "proof-1",
    "proof-2",
    "preview-1",
    "preview-2",
  ],
};

describe("tearDownGallery", () => {
  it("deletes the hero, proof and final assets, then the gallery row", async () => {
    const { store, r2Keys, cloudflareIds } = createInMemoryAssetStore(allAssets);
    let rowDeleted = false;

    await tearDownGallery(store, gallery, async () => {
      expect(r2Keys.size + cloudflareIds.size).toBe(0);
      rowDeleted = true;
    });

    expect(r2Keys.size).toBe(0);
    expect(cloudflareIds.size).toBe(0);
    expect(rowDeleted).toBe(true);
  });

  it.each([
    ["hero", "hero-desktop"],
    ["proof", "proof-2"],
    ["final original", "finals/1.jpg"],
    ["final preview", "preview-2"],
  ])("leaves the gallery row in place when a %s delete fails", async (_kind, failingId) => {
    const { store } = createInMemoryAssetStore(allAssets, [failingId]);
    let rowDeleted = false;

    const teardown = tearDownGallery(store, gallery, async () => {
      rowDeleted = true;
    });

    await expect(teardown).rejects.toBeInstanceOf(AssetDeletionError);
    await expect(teardown).rejects.toMatchObject({ assetId: failingId });
    expect(rowDeleted).toBe(false);
  });
});

describe("deleteFinalPhotoAssets", () => {
  it("deletes the R2 original and the Cloudflare preview", async () => {
    const { store, r2Keys, cloudflareIds } = createInMemoryAssetStore(allAssets);

    await deleteFinalPhotoAssets(store, gallery.finals[0]);

    expect([...r2Keys]).toEqual(["finals/2.jpg"]);
    expect(cloudflareIds.has("preview-1")).toBe(false);
    expect(cloudflareIds.has("preview-2")).toBe(true);
  });
});
