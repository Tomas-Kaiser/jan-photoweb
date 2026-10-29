import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { optimizeImageForUpload } = vi.hoisted(() => ({
  optimizeImageForUpload: vi.fn<(file: File) => Promise<File>>(),
}));
vi.mock("./optimize-image-for-upload", () => ({
  MAX_UPLOAD_BYTES: 100,
  optimizeImageForUpload,
}));

import { uploadPhotoToCloudflare } from "./upload-photo-to-cloudflare";

const fetchMock = vi.fn<typeof fetch>();

function photo(name = "IMG_1.heic", size = 10) {
  return new File([new Uint8Array(size)], name, { type: "image/heic" });
}

describe("uploadPhotoToCloudflare", () => {
  beforeEach(() => {
    optimizeImageForUpload.mockReset();
    optimizeImageForUpload.mockImplementation(async () =>
      new File([new Uint8Array(10)], "IMG_1.jpg", { type: "image/jpeg" }),
    );
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("optimizes the file, uploads it to the direct-upload URL and returns the image id", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ id: "cf-123", uploadURL: "https://upload.test/abc" }),
      )
      .mockResolvedValueOnce(Response.json({ success: true }));
    const file = photo();

    const result = await uploadPhotoToCloudflare(file);

    expect(result).toEqual({ ok: true, cloudflareId: "cf-123" });
    expect(optimizeImageForUpload).toHaveBeenCalledWith(file);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/admin/photos/upload-url", {
      method: "POST",
    });
    const [uploadUrl, init] = fetchMock.mock.calls[1];
    expect(uploadUrl).toBe("https://upload.test/abc");
    const sent = (init?.body as FormData).get("file") as File;
    expect(sent.name).toBe("IMG_1.jpg");
  });

  it("reports the optimizing stage before optimizing and the uploading stage before uploading", async () => {
    const events: string[] = [];
    optimizeImageForUpload.mockImplementation(async () => {
      events.push("optimize");
      return new File([new Uint8Array(10)], "IMG_1.jpg", { type: "image/jpeg" });
    });
    fetchMock.mockImplementation(async (input) => {
      events.push(`fetch ${input}`);
      return input === "/api/admin/photos/upload-url"
        ? Response.json({ id: "cf-123", uploadURL: "https://upload.test/abc" })
        : Response.json({ success: true });
    });

    await uploadPhotoToCloudflare(photo(), {
      onStage: (stage) => events.push(`stage ${stage}`),
    });

    expect(events).toEqual([
      "stage optimizing",
      "optimize",
      "stage uploading",
      "fetch /api/admin/photos/upload-url",
      "fetch https://upload.test/abc",
    ]);
  });

  it("returns a too-large error without uploading when optimization can't get under the limit", async () => {
    optimizeImageForUpload.mockResolvedValue(
      new File([new Uint8Array(101)], "IMG_1.jpg", { type: "image/jpeg" }),
    );

    const result = await uploadPhotoToCloudflare(photo());

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "too-large",
        message: "Still too large after optimization: IMG_1.heic",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an upload-url-failed error carrying the server's message", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "Failed to create upload URL" }, { status: 500 }),
    );

    const result = await uploadPhotoToCloudflare(photo());

    expect(result).toEqual({
      ok: false,
      error: { kind: "upload-url-failed", message: "Failed to create upload URL" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an upload-failed error when Cloudflare rejects the upload", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ id: "cf-123", uploadURL: "https://upload.test/abc" }),
      )
      .mockResolvedValueOnce(Response.json({ success: false }));

    const result = await uploadPhotoToCloudflare(photo());

    expect(result).toEqual({
      ok: false,
      error: { kind: "upload-failed", message: "Failed to upload image: IMG_1.heic" },
    });
  });

  it("returns an unreadable error when the browser can't decode the image", async () => {
    optimizeImageForUpload.mockRejectedValue(
      new Error("Failed to read image: IMG_1.heic"),
    );

    const result = await uploadPhotoToCloudflare(photo());

    expect(result).toEqual({
      ok: false,
      error: { kind: "unreadable", message: "Failed to read image: IMG_1.heic" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns errors instead of throwing when the network fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    expect(await uploadPhotoToCloudflare(photo())).toMatchObject({
      ok: false,
      error: { kind: "upload-url-failed" },
    });

    fetchMock
      .mockResolvedValueOnce(
        Response.json({ id: "cf-123", uploadURL: "https://upload.test/abc" }),
      )
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    expect(await uploadPhotoToCloudflare(photo())).toMatchObject({
      ok: false,
      error: { kind: "upload-failed" },
    });
  });
});
