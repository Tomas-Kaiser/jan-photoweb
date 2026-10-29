import { describe, expect, it } from "vitest";
import { getProofLinkRewrites } from "@/app/lib/proof-link";

describe("getProofLinkRewrites", () => {
  it("rewrites each locale's own link segment onto the proof route", () => {
    expect(getProofLinkRewrites()).toEqual([
      { source: "/en/photos/:token", destination: "/en/proof/:token" },
      { source: "/cs/fotky/:token", destination: "/cs/proof/:token" },
    ]);
  });
});
