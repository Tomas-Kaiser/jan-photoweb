export type CloudflareVariant = "card" | "detail" | "full";

export function getCloudflareImageUrl(
  cloudflareId: string,
  variant: CloudflareVariant = "card",
) {
  return `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${cloudflareId}/${variant}`;
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
