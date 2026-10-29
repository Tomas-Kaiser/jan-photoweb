import { describe, expect, it } from "vitest";
import { formatPragueDateTime } from "./format-date-time";

describe("formatPragueDateTime", () => {
  it("shows the date and time in Prague time, whatever the server's time zone", () => {
    // 23:30 UTC in winter is 00:30 the next day in Prague (UTC+1).
    const label = formatPragueDateTime(new Date("2026-01-15T23:30:00Z"), "en");

    expect(label).toContain("Jan 16, 2026");
    expect(label).toMatch(/12:30\sAM/);
  });

  it("formats in the given locale", () => {
    const label = formatPragueDateTime(new Date("2026-07-01T10:05:00Z"), "cs");

    expect(label).toContain("1. 7. 2026");
    expect(label).toContain("12:05");
  });
});
