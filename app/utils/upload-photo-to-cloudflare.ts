import { MAX_UPLOAD_BYTES, optimizeImageForUpload } from "./optimize-image-for-upload";

type DirectUploadResponse = {
  id: string;
  uploadURL: string;
};

async function requestUploadUrl(): Promise<DirectUploadResponse> {
  const res = await fetch("/api/admin/photos/upload-url", { method: "POST" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Failed to create upload URL.");
  }

  return data;
}

// Uploads an (optimized) copy of `file` to Cloudflare Images and returns its
// asset id. Deliberately does not return the optimized file's name — the
// optimizer may rewrite the extension (see optimize-image-for-upload.ts), so
// callers that need the original filename (e.g. the Lightroom filename
// handoff) must keep `file.name` from before this call.
export async function uploadPhotoToCloudflare(
  file: File,
): Promise<{ cloudflareId: string }> {
  const optimized = await optimizeImageForUpload(file);

  if (optimized.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Still too large after optimization: ${file.name}`);
  }

  const { id, uploadURL } = await requestUploadUrl();

  const formData = new FormData();
  formData.append("file", optimized, optimized.name);

  const uploadRes = await fetch(uploadURL, {
    method: "POST",
    body: formData,
  });

  const uploadData = await uploadRes.json().catch(() => null);

  if (!uploadRes.ok || uploadData?.success === false) {
    throw new Error(`Failed to upload image: ${file.name}`);
  }

  return { cloudflareId: id };
}
