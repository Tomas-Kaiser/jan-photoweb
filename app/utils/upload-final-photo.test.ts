import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageUploadResult } from "./upload-photo-to-cloudflare";

const { uploadPhotoToCloudflare } = vi.hoisted(() => ({
  uploadPhotoToCloudflare: vi.fn<(file: File) => Promise<ImageUploadResult>>(),
}));
vi.mock("./upload-photo-to-cloudflare", () => ({ uploadPhotoToCloudflare }));

import { uploadFinalPhoto } from "./upload-final-photo";

const fetchMock = vi.fn<typeof fetch>();

const file = new File([new Uint8Array(20)], "DSC_1.jpg", {
  type: "image/jpeg",
});

function upload() {
  return uploadFinalPhoto({
    galleryId: "gallery-1",
    file,
    dimensions: { width: 6000, height: 4000 },
  });
}

function requestsTo(url: string) {
  return fetchMock.mock.calls.filter(([input]) => input === url);
}

function jsonBody(call: Parameters<typeof fetch>) {
  return JSON.parse(String(call[1]?.body));
}

describe("uploadFinalPhoto", () => {
  beforeEach(() => {
    uploadPhotoToCloudflare.mockReset();
    uploadPhotoToCloudflare.mockResolvedValue({
      ok: true,
      cloudflareId: "preview-1",
    });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploads the preview and the R2 original, then registers the final photo", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          r2Key: "finals/gallery-1/abc-DSC_1.jpg",
          uploadURL: "https://r2.test/put",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          { success: true, photo: { id: "final-1" } },
          { status: 201 },
        ),
      );

    const result = await upload();

    expect(result).toEqual({
      ok: true,
      id: "final-1",
      previewCloudflareId: "preview-1",
    });
    const [put] = requestsTo("https://r2.test/put");
    expect(put[1]?.method).toBe("PUT");
    expect(put[1]?.body).toBe(file);
    const [register] = requestsTo("/api/admin/final-photos");
    expect(jsonBody(register)).toEqual({
      galleryId: "gallery-1",
      fileName: "DSC_1.jpg",
      sizeBytes: 20,
      r2Key: "finals/gallery-1/abc-DSC_1.jpg",
      previewCloudflareId: "preview-1",
      width: 6000,
      height: 4000,
    });
    expect(requestsTo("/api/admin/final-photos/discard-upload")).toHaveLength(
      0,
    );
  });

  it("discards the preview and the R2 key when the original upload fails", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          r2Key: "finals/gallery-1/abc-DSC_1.jpg",
          uploadURL: "https://r2.test/put",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(Response.json({ success: true }));

    const result = await upload();

    expect(result).toEqual({
      ok: false,
      error: { kind: "original-upload-failed", message: null },
    });
    expect(requestsTo("/api/admin/final-photos")).toHaveLength(0);
    const [discard] = requestsTo("/api/admin/final-photos/discard-upload");
    expect(jsonBody(discard)).toEqual({
      galleryId: "gallery-1",
      previewCloudflareId: "preview-1",
      r2Key: "finals/gallery-1/abc-DSC_1.jpg",
    });
  });

  it("discards the preview and the R2 original when registering the photo fails", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          r2Key: "finals/gallery-1/abc-DSC_1.jpg",
          uploadURL: "https://r2.test/put",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          {
            error: "Final photos can't be uploaded until the client has paid.",
          },
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ success: true }));

    const result = await upload();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "save-failed",
        message: "Final photos can't be uploaded until the client has paid.",
      },
    });
    const [discard] = requestsTo("/api/admin/final-photos/discard-upload");
    expect(jsonBody(discard)).toEqual({
      galleryId: "gallery-1",
      previewCloudflareId: "preview-1",
      r2Key: "finals/gallery-1/abc-DSC_1.jpg",
    });
  });

  it("discards just the preview when no R2 upload URL could be created", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          { error: "Failed to create upload URL" },
          { status: 500 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ success: true }));

    const result = await upload();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "upload-url-failed",
        message: "Failed to create upload URL",
      },
    });
    const [discard] = requestsTo("/api/admin/final-photos/discard-upload");
    expect(jsonBody(discard)).toEqual({
      galleryId: "gallery-1",
      previewCloudflareId: "preview-1",
    });
  });

  it("fails without discarding anything when the preview upload fails", async () => {
    uploadPhotoToCloudflare.mockResolvedValue({
      ok: false,
      error: {
        kind: "too-large",
        message: "Still too large after optimization: DSC_1.jpg",
      },
    });

    const result = await upload();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "preview-failed",
        message: "Still too large after optimization: DSC_1.jpg",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("discards the attempt instead of throwing when the network drops mid-upload", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          r2Key: "finals/gallery-1/abc-DSC_1.jpg",
          uploadURL: "https://r2.test/put",
        }),
      )
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json({ success: true }));

    const result = await upload();

    expect(result).toEqual({
      ok: false,
      error: { kind: "original-upload-failed", message: null },
    });
    const [discard] = requestsTo("/api/admin/final-photos/discard-upload");
    expect(jsonBody(discard)).toEqual({
      galleryId: "gallery-1",
      previewCloudflareId: "preview-1",
      r2Key: "finals/gallery-1/abc-DSC_1.jpg",
    });
  });

  it("reports the photo as saved when registration's response is lost but the row was saved", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          r2Key: "finals/gallery-1/abc-DSC_1.jpg",
          uploadURL: "https://r2.test/put",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        Response.json(
          {
            error: "These assets belong to a saved final photo.",
            photoId: "final-1",
          },
          { status: 409 },
        ),
      );

    const result = await upload();

    expect(result).toEqual({
      ok: true,
      id: "final-1",
      previewCloudflareId: "preview-1",
    });
  });
});
