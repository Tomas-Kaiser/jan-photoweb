import { downloadZip } from "client-zip";

export interface Env {
  FINALS_BUCKET: R2Bucket;
  FINAL_DELIVERY_ZIP_SECRET: string;
}

type FileEntry = { key: string; fileName: string };

type RequestBody = {
  galleryId: string;
  expires: number;
  sig: string;
  files: FileEntry[];
};

// CORS is intentionally permissive — the real access control is the HMAC
// signature below, not the calling origin.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

async function verifySignature(body: RequestBody, secret: string): Promise<boolean> {
  const filesHash = await sha256Hex(
    body.files.map((f) => `${f.key}:${f.fileName}`).join("\n"),
  );
  const expectedSig = await hmacSha256Hex(
    secret,
    `${body.galleryId}:${body.expires}:${filesHash}`,
  );
  return timingSafeEqual(expectedSig, body.sig);
}

const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(req, env);
    } catch (err) {
      // Logged for `wrangler tail`, not exposed to the client — avoids
      // leaking internal details (stack traces, R2 key paths) in responses.
      console.error("Unhandled error:", err);
      return new Response("Internal error", { status: 500, headers: CORS_HEADERS });
    }
  },
};

export default worker;

async function handleRequest(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: CORS_HEADERS });
    }

    if (
      !body?.galleryId ||
      !body?.expires ||
      !body?.sig ||
      !Array.isArray(body.files) ||
      !body.files.length
    ) {
      return new Response("Missing fields", { status: 400, headers: CORS_HEADERS });
    }

    if (!env.FINAL_DELIVERY_ZIP_SECRET) {
      console.error("FINAL_DELIVERY_ZIP_SECRET is not configured on this Worker");
      return new Response("Worker misconfigured", { status: 500, headers: CORS_HEADERS });
    }

    if (Math.floor(Date.now() / 1000) > body.expires) {
      return new Response("Expired", { status: 403, headers: CORS_HEADERS });
    }

    const valid = await verifySignature(body, env.FINAL_DELIVERY_ZIP_SECRET);
    if (!valid) {
      return new Response("Invalid signature", { status: 403, headers: CORS_HEADERS });
    }

    const inputs = [];
    for (const file of body.files) {
      const object = await env.FINALS_BUCKET.get(file.key);
      if (!object) {
        console.error("Skipping missing R2 object:", file.key);
        continue;
      }
      inputs.push({ name: file.fileName, input: object.body, size: object.size });
    }

    if (!inputs.length) {
      return new Response("No files found", { status: 404, headers: CORS_HEADERS });
    }

    const zipResponse = downloadZip(inputs);

    const headers = new Headers(zipResponse.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value);
    }
    headers.set("Content-Disposition", 'attachment; filename="photos.zip"');

    return new Response(zipResponse.body, {
      status: zipResponse.status,
      headers,
    });
}
