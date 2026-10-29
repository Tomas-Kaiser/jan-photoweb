import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addProofPhoto,
  createProofGallery,
  deleteFinalPhoto,
  deleteProofGallery,
  deleteProofPhoto,
  markProofOrderPaid,
  publishFinals,
  reopenProofGallery,
  updateProofGallery,
} from "./proof-gallery-admin-api";

const fetchMock = vi.fn<typeof fetch>();

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return {
    url,
    method: init?.method,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
}

describe("proof gallery admin API", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves gallery fields with a PATCH", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true }));

    const result = await updateProofGallery("gallery-1", { message: "Hi" });

    expect(result).toEqual({ ok: true });
    expect(lastRequest()).toEqual({
      url: "/api/admin/proof-galleries/gallery-1",
      method: "PATCH",
      body: { message: "Hi" },
    });
  });

  it("reports the server's explanation when a request is refused", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "Gallery is locked." }, { status: 409 }),
    );

    const result = await updateProofGallery("gallery-1", { message: "Hi" });

    expect(result).toEqual({ ok: false, error: "Gallery is locked." });
  });

  it("leaves the message to the caller when the failure has no explanation", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>Bad gateway</html>", { status: 502 }),
    );
    expect(await updateProofGallery("gallery-1", {})).toEqual({
      ok: false,
      error: null,
    });

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await updateProofGallery("gallery-1", {})).toEqual({
      ok: false,
      error: null,
    });
  });

  it("creates a gallery and returns its id", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { success: true, gallery: { id: "gallery-2" } },
        { status: 201 },
      ),
    );

    const result = await createProofGallery({
      clientName: "Anna",
      baseCostCents: 0,
      freePhotoCount: 0,
      extraPhotoPriceCents: 0,
      skipProof: true,
    });

    expect(result).toEqual({ ok: true, galleryId: "gallery-2" });
    expect(lastRequest()).toEqual({
      url: "/api/admin/proof-galleries",
      method: "POST",
      body: {
        clientName: "Anna",
        baseCostCents: 0,
        freePhotoCount: 0,
        extraPhotoPriceCents: 0,
        skipProof: true,
      },
    });
  });

  it("adds a proof photo and returns its id", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { success: true, photo: { id: "photo-1" } },
        { status: 201 },
      ),
    );

    const result = await addProofPhoto("gallery-1", {
      cloudflareId: "cf-1",
      fileName: "DSC_1.jpg",
    });

    expect(result).toEqual({ ok: true, photoId: "photo-1" });
    expect(lastRequest()).toEqual({
      url: "/api/admin/proof-galleries/gallery-1/photos",
      method: "POST",
      body: { cloudflareId: "cf-1", fileName: "DSC_1.jpg" },
    });
  });

  it.each([
    {
      name: "delete a proof photo",
      call: () => deleteProofPhoto("gallery-1", "photo-1"),
      url: "/api/admin/proof-galleries/gallery-1/photos",
      method: "DELETE",
      body: { photoId: "photo-1" },
    },
    {
      name: "delete the gallery",
      call: () => deleteProofGallery("gallery-1"),
      url: "/api/admin/proof-galleries/gallery-1",
      method: "DELETE",
      body: undefined,
    },
    {
      name: "mark the order paid",
      call: () => markProofOrderPaid("gallery-1"),
      url: "/api/admin/proof-galleries/gallery-1/mark-paid",
      method: "POST",
      body: undefined,
    },
    {
      name: "reopen the gallery",
      call: () => reopenProofGallery("gallery-1"),
      url: "/api/admin/proof-galleries/gallery-1/reopen",
      method: "POST",
      body: undefined,
    },
    {
      name: "publish finals",
      call: () => publishFinals("gallery-1"),
      url: "/api/admin/proof-galleries/gallery-1/publish-finals",
      method: "POST",
      body: undefined,
    },
    {
      name: "delete a final photo",
      call: () => deleteFinalPhoto("final-1"),
      url: "/api/admin/final-photos",
      method: "DELETE",
      body: { photoId: "final-1" },
    },
  ])("can $name", async ({ call, url, method, body }) => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true }));

    expect(await call()).toEqual({ ok: true });
    expect(lastRequest()).toEqual({ url, method, body });
  });
});
