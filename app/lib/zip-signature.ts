// The signed "download all" request shared by the Next.js app (which signs
// it in app/api/proof/[token]/final-photos/download-all) and the
// workers/delivery-zip Cloudflare Worker (which verifies it). Both import
// this file — the Worker via a relative path, bundled by wrangler — so the
// signing format can't drift between them. Uses only Web Crypto so it runs
// in Node and in the Workers runtime alike.
//
// Changing the format below breaks bulk downloads until the app and the
// Worker are both redeployed.

export type ZipFile = { key: string; fileName: string };

export type ZipRequest = {
  galleryId: string;
  // Unix seconds.
  expires: number;
  files: ZipFile[];
};

export type SignedZipRequest = ZipRequest & { sig: string };

export type ZipVerification = "valid" | "invalid" | "expired";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toHex(digest);
}

async function hmacSha256Hex(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return toHex(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function signZipRequest(request: ZipRequest, secret: string): Promise<string> {
  const filesHash = await sha256Hex(
    request.files.map((f) => `${f.key}:${f.fileName}`).join("\n"),
  );
  return hmacSha256Hex(secret, `${request.galleryId}:${request.expires}:${filesHash}`);
}

export async function verifyZipRequest(
  request: SignedZipRequest,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<ZipVerification> {
  const expectedSig = await signZipRequest(request, secret);
  if (!timingSafeEqual(expectedSig, request.sig)) return "invalid";
  return nowSeconds > request.expires ? "expired" : "valid";
}
