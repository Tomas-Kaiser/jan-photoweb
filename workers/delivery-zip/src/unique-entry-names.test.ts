import { describe, expect, it } from "vitest";
import { uniqueEntryNames } from "./unique-entry-names";

describe("uniqueEntryNames", () => {
  it("numbers repeated file names so no zip entry overwrites another", () => {
    expect(uniqueEntryNames(["IMG_001.jpg", "IMG_002.jpg", "IMG_001.jpg", "IMG_001.jpg"])).toEqual([
      "IMG_001.jpg",
      "IMG_002.jpg",
      "IMG_001 (2).jpg",
      "IMG_001 (3).jpg",
    ]);
  });

  it("treats names differing only in case as duplicates, since macOS and Windows extract them to the same file", () => {
    expect(uniqueEntryNames(["IMG_001.JPG", "img_001.jpg"])).toEqual([
      "IMG_001.JPG",
      "img_001 (2).jpg",
    ]);
  });

  it("skips a numbered name that is already taken by another file", () => {
    expect(uniqueEntryNames(["IMG_001 (2).jpg", "IMG_001.jpg", "IMG_001.jpg"])).toEqual([
      "IMG_001 (2).jpg",
      "IMG_001.jpg",
      "IMG_001 (3).jpg",
    ]);
  });
});
