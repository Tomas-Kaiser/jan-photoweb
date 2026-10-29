import { describe, expect, it } from "vitest";
import { getAdminProofGalleryUrl } from "@/app/lib/admin-link";

describe("getAdminProofGalleryUrl", () => {
  it("links to the gallery's admin page on the configured site", () => {
    expect(getAdminProofGalleryUrl("https://jan.photo", "cs", "abc-123")).toBe(
      "https://jan.photo/cs/admin/proof-galleries/abc-123",
    );
  });

  it("tolerates a trailing slash on the configured site URL", () => {
    expect(getAdminProofGalleryUrl("https://jan.photo/", "en", "abc-123")).toBe(
      "https://jan.photo/en/admin/proof-galleries/abc-123",
    );
  });
});
