import sharp from "sharp";
import { getCloudflareImageUrlCapped } from "@/app/lib/cloudflare-images";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ cloudflareId: string }>;
};

const MAX_DIMENSION = 3000;
const DEFAULT_DIMENSION = 1200;

function clampDimension(raw: string | null) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_DIMENSION;
  return Math.min(Math.round(value), MAX_DIMENSION);
}

// A single diagonal ribbon banner across the top-left corner, like a classic
// corner badge — reads clearly, and unlike a plain axis-aligned box it can't
// be mistaken for part of the photo's own UI chrome.
function buildCornerBadge(imageWidth: number, imageHeight: number) {
  const text = "JAN HÁJEK PHOTOGRAPHY";
  const fontSize = Math.max(13, Math.round(imageWidth / 30));
  const ribbonHeight = Math.round(fontSize * 2.3);
  const ribbonLength = Math.round(imageWidth * 0.55);
  const letterSpacing = Math.round(fontSize * 0.12);

  // Center of the ribbon, placed so that rotating it -45° lays it across the
  // top-left corner — one end toward the left edge, the other toward the
  // top edge.
  const cx = ribbonLength * 0.33;
  const cy = ribbonLength * 0.33;
  const textY = cy + fontSize * 0.32;

  const svg = `
<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-45 ${cx} ${cy})">
    <rect x="${cx - ribbonLength / 2}" y="${cy - ribbonHeight / 2}" width="${ribbonLength}" height="${ribbonHeight}" fill="black" fill-opacity="0.42" />
    <text x="${cx + 1}" y="${textY + 1}" font-family="sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="${letterSpacing}" text-anchor="middle" fill="black" fill-opacity="0.35">${text}</text>
    <text x="${cx}" y="${textY}" font-family="sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="${letterSpacing}" text-anchor="middle" fill="white" fill-opacity="0.95">${text}</text>
  </g>
</svg>`.trim();

  return Buffer.from(svg);
}

export async function GET(req: Request, { params }: Params) {
  const { cloudflareId } = await params;
  const { searchParams } = new URL(req.url);

  const width = clampDimension(searchParams.get("w"));
  const height = clampDimension(searchParams.get("h"));

  try {
    const sourceRes = await fetch(
      getCloudflareImageUrlCapped(cloudflareId, width, height),
    );

    if (!sourceRes.ok) {
      return new Response("Image not found", { status: 404 });
    }

    const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer());
    const image = sharp(sourceBuffer);
    const metadata = await image.metadata();
    const imageWidth = metadata.width ?? width;
    const imageHeight = metadata.height ?? height;

    const watermarked = await image
      .composite([{ input: buildCornerBadge(imageWidth, imageHeight) }])
      .jpeg({ quality: 85 })
      .toBuffer();

    return new Response(new Uint8Array(watermarked), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/proof-image/[cloudflareId] failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
