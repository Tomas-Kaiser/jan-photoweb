import { describe, expect, it } from "vitest";
import { signZipRequest, verifyZipRequest } from "@/app/lib/zip-signature";

const SECRET = "test-secret";
const NOW = 1_800_000_000;

const request = {
  galleryId: "gallery-1",
  expires: NOW + 300,
  files: [
    { key: "finals/gallery-1/a.jpg", fileName: "IMG_001.jpg" },
    { key: "finals/gallery-1/b.jpg", fileName: "IMG_002.jpg" },
  ],
};

describe("zip signature", () => {
  it("verifies a request signed with the same secret", async () => {
    const sig = await signZipRequest(request, SECRET);

    expect(await verifyZipRequest({ ...request, sig }, SECRET, NOW)).toBe("valid");
  });

  it("keeps the wire format the deployed Worker expects", async () => {
    // Computed with Node's createHmac/createHash using the format the app
    // and Worker have always used — a change here means both need
    // redeploying together.
    expect(await signZipRequest(request, SECRET)).toBe(
      "ed9487e0a0adf30d474b4a565e7ccb99f26cb56e1458c388790f30e09bcc1f28",
    );
  });

  it.each([
    ["a file key", { files: [{ ...request.files[0], key: "finals/other/a.jpg" }, request.files[1]] }],
    ["a file name", { files: [{ ...request.files[0], fileName: "evil.jpg" }, request.files[1]] }],
    ["an added file", { files: [...request.files, { key: "finals/other/c.jpg", fileName: "c.jpg" }] }],
    ["the file order", { files: [request.files[1], request.files[0]] }],
    ["the gallery id", { galleryId: "gallery-2" }],
    ["the expiry", { expires: NOW + 3600 }],
  ])("rejects a request after changing %s", async (_label, change) => {
    const sig = await signZipRequest(request, SECRET);

    expect(await verifyZipRequest({ ...request, ...change, sig }, SECRET, NOW)).toBe("invalid");
  });

  it("rejects a request signed with a different secret", async () => {
    const sig = await signZipRequest(request, "other-secret");

    expect(await verifyZipRequest({ ...request, sig }, SECRET, NOW)).toBe("invalid");
  });

  it("rejects an expired request even when the signature is valid", async () => {
    const sig = await signZipRequest(request, SECRET);

    expect(await verifyZipRequest({ ...request, sig }, SECRET, request.expires + 1)).toBe(
      "expired",
    );
  });
});
