import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDaysUntilFinalDeliveryDeletion,
  getFinalDeliveryExpiryCutoff,
  getFinalDeliveryDeletionDate,
} from "./final-delivery-retention";

afterEach(() => {
  vi.useRealTimers();
});

describe("getFinalDeliveryDeletionDate", () => {
  it("deletes a gallery one year after its finals were published", () => {
    expect(
      getFinalDeliveryDeletionDate(new Date("2026-03-10T09:00:00Z")),
    ).toEqual(new Date("2027-03-10T09:00:00Z"));
  });
});

describe("getDaysUntilFinalDeliveryDeletion", () => {
  it("counts the days left until the deletion date", () => {
    vi.useFakeTimers({ now: new Date("2027-03-01T09:00:00Z") });

    expect(
      getDaysUntilFinalDeliveryDeletion(new Date("2026-03-10T09:00:00Z")),
    ).toBe(9);
  });

  it("never goes negative once the deletion date has passed", () => {
    vi.useFakeTimers({ now: new Date("2027-06-01T09:00:00Z") });

    expect(
      getDaysUntilFinalDeliveryDeletion(new Date("2026-03-10T09:00:00Z")),
    ).toBe(0);
  });
});

describe("getFinalDeliveryExpiryCutoff", () => {
  it("expires galleries whose finals were published a year or more ago", () => {
    vi.useFakeTimers({ now: new Date("2027-03-10T09:00:00Z") });

    expect(getFinalDeliveryExpiryCutoff()).toEqual(
      new Date("2026-03-10T09:00:00Z"),
    );
  });
});
