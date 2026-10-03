import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

// R2 speaks the S3 API, so the AWS SDK is used purely as a generic
// S3-compatible client here — requests go to Cloudflare's R2 endpoint, never
// to Amazon. Region is always "auto" per R2's S3-compat convention.
function getR2Client(): S3Client {
  if (client) return client;

  client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    // R2 doesn't support virtual-hosted-style requests (bucket name as a
    // subdomain) — without this, the SDK's default addressing produces a
    // host that doesn't resolve to the actual bucket.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return client;
}

const UPLOAD_URL_EXPIRY_SECONDS = 10 * 60;
const DOWNLOAD_URL_EXPIRY_SECONDS = 5 * 60;

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getR2Client(), command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });
}

export async function createPresignedDownloadUrl(
  key: string,
  fileName: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, "")}"`,
  });

  return getSignedUrl(getR2Client(), command, {
    expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
  });
}

// Deletes an object from R2. Throws on any failure other than "already
// gone" (NoSuchKey/404), which is treated as success since the end state —
// no object left in R2 — is the same either way (mirrors
// deleteCloudflareImage's handling in cloudflare-images.ts).
export async function deleteR2Object(key: string): Promise<void> {
  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (error) {
    const code = (error as { name?: string; Code?: string })?.name;
    if (code === "NoSuchKey" || code === "NotFound") return;
    throw error;
  }
}
