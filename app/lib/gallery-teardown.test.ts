import { describe, expect, it } from "vitest";
import {
  AssetDeletionError,
  type AssetStore,
  deleteFinalPhotoAssets,
  type GalleryRecords,
  type LinkedClient,
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

// In-memory stand-in for the gallery's database rows: deleting the gallery
// cascades its client links, and the clients chosen go with it.
function createInMemoryGalleryRecords(linkedClients: LinkedClient[] = []) {
  const clientIds = new Set(linkedClients.map((client) => client.id));
  let rowDeleted = false;

  const records: GalleryRecords = {
    async deleteGallery(chooseClientsToDelete) {
      for (const id of chooseClientsToDelete(linkedClients)) clientIds.delete(id);
      rowDeleted = true;
    },
  };

  return { records, clientIds, isRowDeleted: () => rowDeleted };
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
    const { records, isRowDeleted } = createInMemoryGalleryRecords();

    await tearDownGallery(store, gallery, {
      async deleteGallery(chooseClientsToDelete) {
        expect(r2Keys.size + cloudflareIds.size).toBe(0);
        await records.deleteGallery(chooseClientsToDelete);
      },
    });

    expect(r2Keys.size).toBe(0);
    expect(cloudflareIds.size).toBe(0);
    expect(isRowDeleted()).toBe(true);
  });

  it("deletes a client left with no galleries and no marketing consent", async () => {
    const { store } = createInMemoryAssetStore(allAssets);
    const { records, clientIds } = createInMemoryGalleryRecords([
      { id: "owner", hasOtherGalleries: false, hasMarketingConsent: false },
    ]);

    await tearDownGallery(store, gallery, records);

    expect(clientIds.has("owner")).toBe(false);
  });

  it("keeps a client with marketing consent or another gallery", async () => {
    const { store } = createInMemoryAssetStore(allAssets);
    const { records, clientIds } = createInMemoryGalleryRecords([
      { id: "consenting-owner", hasOtherGalleries: false, hasMarketingConsent: true },
      { id: "repeat-guest", hasOtherGalleries: true, hasMarketingConsent: false },
      { id: "one-off-guest", hasOtherGalleries: false, hasMarketingConsent: false },
    ]);

    await tearDownGallery(store, gallery, records);

    expect([...clientIds]).toEqual(["consenting-owner", "repeat-guest"]);
  });

  it.each([
    ["hero", "hero-desktop"],
    ["proof", "proof-2"],
    ["final original", "finals/1.jpg"],
    ["final preview", "preview-2"],
  ])("leaves the gallery row in place when a %s delete fails", async (_kind, failingId) => {
    const { store } = createInMemoryAssetStore(allAssets, [failingId]);
    const { records, clientIds, isRowDeleted } = createInMemoryGalleryRecords([
      { id: "owner", hasOtherGalleries: false, hasMarketingConsent: false },
    ]);

    const teardown = tearDownGallery(store, gallery, records);

    await expect(teardown).rejects.toBeInstanceOf(AssetDeletionError);
    await expect(teardown).rejects.toMatchObject({ assetId: failingId });
    expect(isRowDeleted()).toBe(false);
    expect(clientIds.has("owner")).toBe(true);
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

  it("deletes just the preview of an upload that never reached R2", async () => {
    const { store, r2Keys, cloudflareIds } = createInMemoryAssetStore(allAssets);

    await deleteFinalPhotoAssets(store, { previewCloudflareId: "preview-1" });

    expect(r2Keys.size).toBe(2);
    expect(cloudflareIds.has("preview-1")).toBe(false);
    expect(cloudflareIds.has("preview-2")).toBe(true);
  });
});
