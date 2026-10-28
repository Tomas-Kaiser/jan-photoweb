import { describe, expect, it } from "vitest";
import { slugify } from "@/app/lib/slugify";

describe("slugify", () => {
  it("strips diacritics and joins words with single dashes", () => {
    expect(slugify("  Nováková – Svatba 2026!  ")).toBe("novakova-svatba-2026");
  });
});
