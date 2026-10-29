import { MAX_UPLOAD_BYTES, optimizeImageForUpload } from "./optimize-image-for-upload";

type DirectUploadResponse = {
  id: string;
  uploadURL: string;
};

// `message` is an English fallback; translated forms map `kind` to their own
// copy instead.
export type ImageUploadError = {
  kind: "unreadable" | "too-large" | "upload-url-failed" | "upload-failed";
  message: string;
};

export type ImageUploadStage = "optimizing" | "uploading";

export type ImageUploadResult =
  | { ok: true; cloudflareId: string }
  | { ok: false; error: ImageUploadError };

function failure(
  kind: ImageUploadError["kind"],
  message: string,
): ImageUploadResult {
  return { ok: false, error: { kind, message } };
}

async function requestUploadUrl(): Promise<
  DirectUploadResponse | { error: string }
> {
  try {
    const res = await fetch("/api/admin/photos/upload-url", { method: "POST" });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.uploadURL) {
      return { error: data?.error || "Failed to create upload URL." };
    }

    return data;
  } catch {
    return { error: "Failed to create upload URL." };
  }
}

async function postToUploadUrl(uploadURL: string, file: File): Promise<boolean> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  try {
    const res = await fetch(uploadURL, { method: "POST", body: formData });
    const data = await res.json().catch(() => null);
    return res.ok && data?.success !== false;
  } catch {
    return false;
  }
}

// Uploads an (optimized) copy of `file` to Cloudflare Images and returns its
// asset id, or a typed error — it never throws. Deliberately does not return
// the optimized file's name — the optimizer may rewrite the extension (see
// optimize-image-for-upload.ts), so callers that need the original filename
// (e.g. the Lightroom filename handoff) must keep `file.name`.
export async function uploadPhotoToCloudflare(
  file: File,
  { onStage }: { onStage?: (stage: ImageUploadStage) => void } = {},
): Promise<ImageUploadResult> {
  onStage?.("optimizing");
  let optimized: File;
  try {
    optimized = await optimizeImageForUpload(file);
  } catch (err) {
    return failure(
      "unreadable",
      err instanceof Error ? err.message : `Failed to read image: ${file.name}`,
    );
  }

  if (optimized.size > MAX_UPLOAD_BYTES) {
    return failure(
      "too-large",
      `Still too large after optimization: ${file.name}`,
    );
  }

  onStage?.("uploading");
  const upload = await requestUploadUrl();

  if ("error" in upload) {
    return failure("upload-url-failed", upload.error);
  }

  if (!(await postToUploadUrl(upload.uploadURL, optimized))) {
    return failure("upload-failed", `Failed to upload image: ${file.name}`);
  }

  return { ok: true, cloudflareId: upload.id };
}
