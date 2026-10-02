export type CloudflareVariant = "card" | "detail" | "full";

export function getCloudflareImageUrl(
  cloudflareId: string,
  variant: CloudflareVariant = "card",
) {
  return `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${cloudflareId}/${variant}`;
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
  return `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${cloudflareId}/w=${maxWidth},h=${maxHeight},fit=scale-down`;
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
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${encodeURIComponent(cloudflareId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
    },
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    console.error("Cloudflare delete failed:", text);
    throw new Error("Failed to delete image from Cloudflare");
  }
}
