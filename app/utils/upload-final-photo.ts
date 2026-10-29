import { uploadPhotoToCloudflare } from "./upload-photo-to-cloudflare";

export type FinalUploadStage =
  | "uploadingPreview"
  | "uploadingOriginal"
  | "saving";

// The preview helper always explains its failure. For the other steps
// `message` is the server's explanation when there is one; otherwise null,
// and the form shows its own copy for `kind`.
export type FinalUploadError =
  | { kind: "preview-failed"; message: string }
  | {
      kind: "upload-url-failed" | "original-upload-failed" | "save-failed";
      message: string | null;
    };

export type FinalUploadResult =
  | { ok: true; id: string; previewCloudflareId: string }
  | { ok: false; error: FinalUploadError };

// A network failure is reported as a null response, like any other failed
// step, so the caller can still discard what was already uploaded.
async function fetchOrNull(input: string, init: RequestInit) {
  try {
    return await fetch(input, init);
  } catch {
    return null;
  }
}

function postJson(url: string, body: unknown) {
  return fetchOrNull(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Asks the server to delete whatever this attempt already uploaded. Returns
// the saved photo's id if the server refused because the row exists after
// all (its registration response was lost). Otherwise best-effort: a failed
// discard only leaks the assets, so it's logged, not surfaced over the
// upload error the admin needs to see.
async function discardUpload(body: {
  galleryId: string;
  previewCloudflareId: string;
  r2Key?: string;
}): Promise<{ savedPhotoId: string | null }> {
  const res = await postJson("/api/admin/final-photos/discard-upload", body);
  const data = await res?.json().catch(() => null);

  if (res?.status === 409 && typeof data?.photoId === "string") {
    return { savedPhotoId: data.photoId };
  }
  if (!res?.ok) {
    console.error(
      "Failed to discard partial final photo upload:",
      res?.status ?? "network error",
    );
  }
  return { savedPhotoId: null };
}

// Uploads one final photo in three steps: a resized preview to Cloudflare
// Images, the untouched original to R2 (raw PUT to a presigned URL), then
// the final photo row that ties them together. Never throws: a failed step
// discards the attempt's uploads and returns a typed error.
export async function uploadFinalPhoto({
  galleryId,
  file,
  dimensions,
  onStage,
}: {
  galleryId: string;
  file: File;
  dimensions: { width: number; height: number } | null;
  onStage?: (stage: FinalUploadStage) => void;
}): Promise<FinalUploadResult> {
  const contentType = file.type || "application/octet-stream";

  onStage?.("uploadingPreview");
  const preview = await uploadPhotoToCloudflare(file);
  if (!preview.ok) {
    return {
      ok: false,
      error: { kind: "preview-failed", message: preview.error.message },
    };
  }
  const previewCloudflareId = preview.cloudflareId;

  onStage?.("uploadingOriginal");
  const urlRes = await postJson("/api/admin/final-photos/upload-url", {
    galleryId,
    fileName: file.name,
    contentType,
  });
  const urlData = await urlRes?.json().catch(() => null);

  if (!urlRes?.ok || !urlData?.uploadURL) {
    await discardUpload({ galleryId, previewCloudflareId });
    return {
      ok: false,
      error: { kind: "upload-url-failed", message: urlData?.error ?? null },
    };
  }

  const { r2Key, uploadURL } = urlData;

  const putRes = await fetchOrNull(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });

  if (!putRes?.ok) {
    await discardUpload({ galleryId, previewCloudflareId, r2Key });
    return {
      ok: false,
      error: { kind: "original-upload-failed", message: null },
    };
  }

  onStage?.("saving");
  const saveRes = await postJson("/api/admin/final-photos", {
    galleryId,
    fileName: file.name,
    sizeBytes: file.size,
    r2Key,
    previewCloudflareId,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  });
  const saveData = await saveRes?.json().catch(() => null);

  if (saveRes?.ok && typeof saveData?.photo?.id === "string") {
    return { ok: true, id: saveData.photo.id, previewCloudflareId };
  }

  // Without a readable success we can't tell whether the row was saved, so
  // discard — the server refuses (and hands back the id) if it was.
  const { savedPhotoId } = await discardUpload({
    galleryId,
    previewCloudflareId,
    r2Key,
  });

  if (savedPhotoId) {
    return { ok: true, id: savedPhotoId, previewCloudflareId };
  }

  return {
    ok: false,
    error: { kind: "save-failed", message: saveData?.error ?? null },
  };
}
