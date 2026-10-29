import { downloadZip } from "client-zip";
// Shared with the Next.js app, which signs these requests — see that file
// before changing the signing format.
import { verifyZipRequest, type SignedZipRequest } from "../../../app/lib/zip-signature";
import { uniqueEntryNames } from "./unique-entry-names";

export interface Env {
  FINALS_BUCKET: R2Bucket;
  FINAL_DELIVERY_ZIP_SECRET: string;
}

type RequestBody = SignedZipRequest;

// CORS is intentionally permissive — the real access control is the HMAC
// signature below, not the calling origin.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    const verification = await verifyZipRequest(body, env.FINAL_DELIVERY_ZIP_SECRET);
    if (verification === "expired") {
      return new Response("Expired", { status: 403, headers: CORS_HEADERS });
    }
    if (verification !== "valid") {
      return new Response("Invalid signature", { status: 403, headers: CORS_HEADERS });
    }

    const presentFiles: { fileName: string; object: R2ObjectBody }[] = [];
    for (const file of body.files) {
      const object = await env.FINALS_BUCKET.get(file.key);
      if (!object) {
        console.error("Skipping missing R2 object:", file.key);
        continue;
      }
      presentFiles.push({ fileName: file.fileName, object });
    }

    if (!presentFiles.length) {
      return new Response("No files found", { status: 404, headers: CORS_HEADERS });
    }

    const entryNames = uniqueEntryNames(presentFiles.map((f) => f.fileName));
    const zipResponse = downloadZip(
      presentFiles.map((f, i) => ({ name: entryNames[i], input: f.object.body, size: f.object.size })),
    );

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
