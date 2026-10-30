import { describe, expect, it } from "vitest";
import { parseGalleryEventType } from "./gallery-event-type";

describe("parseGalleryEventType", () => {
  it("accepts each kind of shoot", () => {
    for (const eventType of [
      "wedding",
      "couple",
      "family",
      "portrait",
      "other",
    ]) {
      expect(parseGalleryEventType(eventType)).toEqual({ ok: true, eventType });
    }
  });

  it("treats a blank or missing value as no event type", () => {
    for (const value of ["", "  ", null, undefined]) {
      expect(parseGalleryEventType(value)).toEqual({
        ok: true,
        eventType: null,
      });
    }
  });

  it("rejects anything that isn't a known kind of shoot", () => {
    for (const value of ["birthday", "Wedding", 3, true, {}]) {
      expect(parseGalleryEventType(value)).toEqual({ ok: false });
    }
  });
});
