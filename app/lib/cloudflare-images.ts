export type CloudflareVariant = "card" | "detail" | "full";

export function getCloudflareImageUrl(
    cloudflareId: string,
    variant: CloudflareVariant = "card"
) {
    return `https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/${cloudflareId}/${variant}`;
}