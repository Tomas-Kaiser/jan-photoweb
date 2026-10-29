export type CloudflareVariant = "card" | "detail" | "full";

const DELIVERY_BASE = "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg";

// Calls the Cloudflare Images API. Throws before sending anything if the
// credentials are missing — otherwise a misconfigured deploy would hit
// `accounts/undefined/...`, and a resulting 404 could pass for "already
// deleted".
function fetchImagesApi(path: string, method: "POST" | "DELETE") {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Missing Cloudflare Images configuration");
  }

  return fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/${path}`,
    { method, headers: { Authorization: `Bearer ${apiToken}` } },
  );
}

export function getCloudflareImageUrl(
  cloudflareId: string,
  variant: CloudflareVariant = "card",
) {
  return `${DELIVERY_BASE}/${cloudflareId}/${variant}`;
}

// Uses Cloudflare Images' flexible variants (enabled on this account) to
// hard-cap dimensions via on-the-fly resizing, rather than relying on a
// named variant's configured size — guarantees the cap regardless of how
// "detail"/"card"/etc. are set up. `fit=scale-down` only ever shrinks,
// never upscales past the original.
export function getCloudflareImageUrlCapped(
  cloudflareId: string,
  maxWidth: number,
  maxHeight: number,
) {
  return `${DELIVERY_BASE}/${cloudflareId}/w=${maxWidth},h=${maxHeight},fit=scale-down`;
}

// Points at our own watermarking proxy (app/api/proof-image/[cloudflareId])
// rather than imagedelivery.net directly — Cloudflare Images' variant system
// has no watermark/overlay option, so the watermark is composited server-side
// with sharp. Only ever used for the client-facing, pre-submission proof
// selection UI (see docs/photo-proofing-design.md §7); admin and
// already-submitted views keep using the plain Cloudflare URLs above.
export function getWatermarkedProofImageUrl(
  cloudflareId: string,
  maxWidth: number,
  maxHeight: number,
) {
  return `/api/proof-image/${cloudflareId}?w=${maxWidth}&h=${maxHeight}`;
}

// Deletes an image from Cloudflare Images. Throws on any failure other than
// "already gone" (404), which is treated as success since the end state —
// no image left on Cloudflare — is the same either way.
export async function deleteCloudflareImage(cloudflareId: string) {
  const res = await fetchImagesApi(
    `v1/${encodeURIComponent(cloudflareId)}`,
    "DELETE",
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    console.error("Cloudflare delete failed:", text);
    throw new Error("Failed to delete image from Cloudflare");
  }
}

// Requests a one-time direct-creator upload URL: the browser POSTs the file
// straight to `uploadURL`, and `id` is the Cloudflare image id it will get.
export async function requestCloudflareDirectUpload(): Promise<{
  id: string;
  uploadURL: string;
}> {
  const res = await fetchImagesApi("v2/direct_upload", "POST");
  const data: { result?: { id: string; uploadURL: string } } | null =
    await res.json().catch(() => null);

  if (!res.ok || !data?.result) {
    console.error("Cloudflare direct upload request failed:", data);
    throw new Error("Failed to create Cloudflare upload URL");
  }

  return { id: data.result.id, uploadURL: data.result.uploadURL };
}
