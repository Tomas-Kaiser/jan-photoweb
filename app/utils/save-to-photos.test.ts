import { describe, expect, it } from "vitest";
import { imageMimeType } from "./save-to-photos";

describe("imageMimeType", () => {
  it("keeps an image type the server sent", () => {
    expect(imageMimeType("photo.jpg", "image/png")).toBe("image/png");
  });

  it("guesses from the extension when the response is untyped", () => {
    expect(imageMimeType("IMG_1.HEIC", "")).toBe("image/heic");
    expect(imageMimeType("a.jpeg", "application/octet-stream")).toBe(
      "image/jpeg",
    );
  });

  it("falls back to JPEG for an unknown extension", () => {
    expect(imageMimeType("photo", "")).toBe("image/jpeg");
  });
});
