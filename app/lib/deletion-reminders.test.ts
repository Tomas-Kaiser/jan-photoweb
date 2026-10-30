import { describe, expect, it } from "vitest";
import { getDueDeletionReminder } from "./deletion-reminders";

// Published 2026-03-10T09:00Z, so deleted 2027-03-10T09:00Z: the 30-day
// reminder is due from 2027-02-08T09:00Z, the 7-day one from 2027-03-03T09:00Z.
const finalsPublishedAt = new Date("2026-03-10T09:00:00Z");
const notSent = { reminder30SentAt: null, reminder7SentAt: null };

describe("getDueDeletionReminder", () => {
  it("sends nothing more than 30 days before deletion", () => {
    expect(
      getDueDeletionReminder(
        { finalsPublishedAt, ...notSent },
        new Date("2027-02-08T08:59:00Z"),
      ),
    ).toBeNull();
  });

  it("sends the 30-day reminder from 30 days before deletion", () => {
    expect(
      getDueDeletionReminder(
        { finalsPublishedAt, ...notSent },
        new Date("2027-02-08T09:00:00Z"),
      ),
    ).toBe(30);
  });

  it("catches up on the 30-day reminder when the cron missed the day", () => {
    expect(
      getDueDeletionReminder(
        { finalsPublishedAt, ...notSent },
        new Date("2027-02-12T03:15:00Z"),
      ),
    ).toBe(30);
  });

  it("sends the 30-day reminder only once", () => {
    expect(
      getDueDeletionReminder(
        {
          finalsPublishedAt,
          reminder30SentAt: new Date("2027-02-09T03:15:00Z"),
          reminder7SentAt: null,
        },
        new Date("2027-02-10T03:15:00Z"),
      ),
    ).toBeNull();
  });

  it("sends the 7-day reminder from 7 days before deletion", () => {
    expect(
      getDueDeletionReminder(
        {
          finalsPublishedAt,
          reminder30SentAt: new Date("2027-02-09T03:15:00Z"),
          reminder7SentAt: null,
        },
        new Date("2027-03-03T09:00:00Z"),
      ),
    ).toBe(7);
  });

  it("sends only the 7-day reminder when both were missed", () => {
    expect(
      getDueDeletionReminder(
        { finalsPublishedAt, ...notSent },
        new Date("2027-03-05T03:15:00Z"),
      ),
    ).toBe(7);
  });

  it("sends nothing more once the 7-day reminder went out", () => {
    expect(
      getDueDeletionReminder(
        {
          finalsPublishedAt,
          reminder30SentAt: null,
          reminder7SentAt: new Date("2027-03-05T03:15:00Z"),
        },
        new Date("2027-03-06T03:15:00Z"),
      ),
    ).toBeNull();
  });

  it("sends nothing once the deletion date has passed", () => {
    expect(
      getDueDeletionReminder(
        { finalsPublishedAt, ...notSent },
        new Date("2027-03-10T09:00:00Z"),
      ),
    ).toBeNull();
  });
});
