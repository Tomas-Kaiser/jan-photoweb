import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteCloudflareImage,
  requestCloudflareDirectUpload,
} from "@/app/lib/cloudflare-images";

function stubCloudflare(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account");
  vi.stubEnv("CLOUDFLARE_IMAGES_API_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("requestCloudflareDirectUpload", () => {
  it("returns the new image id and its one-time upload URL", async () => {
    stubCloudflare(
      Response.json({
        success: true,
        result: { id: "img-1", uploadURL: "https://upload.example/img-1" },
      }),
    );

    await expect(requestCloudflareDirectUpload()).resolves.toEqual({
      id: "img-1",
      uploadURL: "https://upload.example/img-1",
    });
  });

  it("throws when Cloudflare refuses the request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubCloudflare(
      Response.json({ success: false, errors: [{ code: 10000 }] }, { status: 403 }),
    );

    await expect(requestCloudflareDirectUpload()).rejects.toThrow(
      "Failed to create Cloudflare upload URL",
    );
  });
});

describe("deleteCloudflareImage", () => {
  it("deletes the image by id", async () => {
    const fetchMock = stubCloudflare(Response.json({ success: true }));

    await expect(deleteCloudflareImage("img/1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/images\/v1\/img%2F1$/),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("treats an image that's already gone (404) as deleted", async () => {
    stubCloudflare(Response.json({ success: false }, { status: 404 }));

    await expect(deleteCloudflareImage("img-1")).resolves.toBeUndefined();
  });

  it("throws on any other failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubCloudflare(Response.json({ success: false }, { status: 500 }));

    await expect(deleteCloudflareImage("img-1")).rejects.toThrow(
      "Failed to delete image from Cloudflare",
    );
  });

  it("refuses to call Cloudflare when its credentials aren't configured", async () => {
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "");
    const fetchMock = stubCloudflare(Response.json({ success: false }, { status: 404 }));

    await expect(deleteCloudflareImage("img-1")).rejects.toThrow(
      "Missing Cloudflare Images configuration",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
