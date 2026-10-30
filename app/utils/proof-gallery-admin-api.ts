// Browser client for the admin proof-gallery endpoints (plus deleting a
// final photo from the gallery screen, and the contacts screen's actions).
// Final photo uploads have their own multi-step helper,
// upload-final-photo.ts.

import type { GalleryEventType } from "@/app/lib/gallery-event-type";

export type ProofGalleryPatch = {
  clientName?: string;
  baseCostCents?: number;
  freePhotoCount?: number;
  extraPhotoPriceCents?: number;
  message?: string;
  eventDate?: string;
  // null clears it.
  eventType?: GalleryEventType | null;
  requiresRegistration?: boolean;
  finalsMessage?: string;
  // "" clears the slot.
  heroMobileCloudflareId?: string;
  heroDesktopCloudflareId?: string;
};

export type ApiResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string | null };

// The one error path for every endpoint: `error` is the server's own
// explanation when it sent one, otherwise null and the caller shows its own
// translated copy. Never throws.
async function request(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string | null }> {
  let res: Response;
  try {
    res = await fetch(
      url,
      body === undefined
        ? { method }
        : {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
    );
  } catch {
    return { ok: false, error: null };
  }
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: typeof data?.error === "string" && data.error ? data.error : null,
    };
  }
  return { ok: true, data };
}

// For endpoints whose success carries nothing the caller needs.
function withoutData(result: Awaited<ReturnType<typeof request>>): ApiResult {
  return result.ok ? { ok: true } : result;
}

export async function createProofGallery(input: {
  clientName: string;
  baseCostCents: number;
  freePhotoCount: number;
  extraPhotoPriceCents: number;
  skipProof?: boolean;
  eventType?: GalleryEventType | null;
}): Promise<ApiResult<{ galleryId: string }>> {
  const result = await request("/api/admin/proof-galleries", "POST", input);
  if (!result.ok) return result;
  const { gallery } = result.data as { gallery: { id: string } };
  return { ok: true, galleryId: gallery.id };
}

export async function updateProofGallery(
  galleryId: string,
  patch: ProofGalleryPatch,
): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/proof-galleries/${galleryId}`, "PATCH", patch),
  );
}

export async function deleteProofGallery(
  galleryId: string,
): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/proof-galleries/${galleryId}`, "DELETE"),
  );
}

export async function addProofPhoto(
  galleryId: string,
  photo: { cloudflareId: string; fileName: string },
): Promise<ApiResult<{ photoId: string }>> {
  const result = await request(
    `/api/admin/proof-galleries/${galleryId}/photos`,
    "POST",
    photo,
  );
  if (!result.ok) return result;
  const { photo: saved } = result.data as { photo: { id: string } };
  return { ok: true, photoId: saved.id };
}

export async function deleteProofPhoto(
  galleryId: string,
  photoId: string,
): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/proof-galleries/${galleryId}/photos`, "DELETE", {
      photoId,
    }),
  );
}

export async function markProofOrderPaid(
  galleryId: string,
): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/proof-galleries/${galleryId}/mark-paid`, "POST"),
  );
}

export async function reopenProofGallery(
  galleryId: string,
): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/proof-galleries/${galleryId}/reopen`, "POST"),
  );
}

export async function publishFinals(galleryId: string): Promise<ApiResult> {
  return withoutData(
    await request(
      `/api/admin/proof-galleries/${galleryId}/publish-finals`,
      "POST",
    ),
  );
}

export async function deleteFinalPhoto(photoId: string): Promise<ApiResult> {
  return withoutData(
    await request("/api/admin/final-photos", "DELETE", { photoId }),
  );
}

export async function clearContactConsent(
  clientId: string,
): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/contacts/${clientId}/clear-consent`, "POST"),
  );
}

export async function deleteContact(clientId: string): Promise<ApiResult> {
  return withoutData(
    await request(`/api/admin/contacts/${clientId}`, "DELETE"),
  );
}
