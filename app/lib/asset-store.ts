import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";
import type { AssetStore } from "@/app/lib/gallery-teardown";
import { deleteR2Object } from "@/app/lib/r2-client";

// The real asset store: final originals in R2, everything else in
// Cloudflare Images.
export const assetStore: AssetStore = {
  deleteR2Object,
  deleteCloudflareImage,
};
