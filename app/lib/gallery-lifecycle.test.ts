import { describe, expect, it } from "vitest";
import {
  getClientView,
  getGalleryPermissions,
  getGalleryStage,
} from "@/app/lib/gallery-lifecycle";

const published = new Date("2026-05-01T10:00:00Z");

describe("getGalleryStage", () => {
  it("walks a proof gallery through proof → submitted → awaiting finals → delivered", () => {
    expect(
      getGalleryStage({ skipProof: false, finalsPublishedAt: null, order: null }),
    ).toBe("proof");
    expect(
      getGalleryStage({
        skipProof: false,
        finalsPublishedAt: null,
        order: { status: "pending_payment" },
      }),
    ).toBe("submitted");
    expect(
      getGalleryStage({
        skipProof: false,
        finalsPublishedAt: null,
        order: { status: "paid" },
      }),
    ).toBe("awaitingFinals");
    expect(
      getGalleryStage({
        skipProof: false,
        finalsPublishedAt: published,
        order: { status: "paid" },
      }),
    ).toBe("delivered");
  });

  it("starts a skip-proof gallery at awaiting finals, then delivered once published", () => {
    expect(
      getGalleryStage({ skipProof: true, finalsPublishedAt: null, order: null }),
    ).toBe("awaitingFinals");
    expect(
      getGalleryStage({
        skipProof: true,
        // As serialized for a client component.
        finalsPublishedAt: published.toISOString(),
        order: null,
      }),
    ).toBe("delivered");
  });
});

describe("getGalleryPermissions", () => {
  it("unlocks pricing, the client message and proof photos again after a reopen", () => {
    // Reopen deletes the pending order, which is all the module sees.
    const reopened = getGalleryPermissions({
      skipProof: false,
      finalsPublishedAt: null,
      order: null,
    });

    expect(reopened).toMatchObject({
      canEditPricing: true,
      canEditClientMessage: true,
      canEditProofPhotos: true,
      canClientSubmit: true,
    });
  });
});

describe("getGalleryPermissions by stage", () => {
  const none = {
    canEditPricing: false,
    canEditClientMessage: false,
    canEditProofPhotos: false,
    canReopen: false,
    canMarkPaid: false,
    canUploadFinals: false,
    canDeleteFinals: false,
    canPublishFinals: false,
    canEditFinalsPage: false,
    canClientSubmit: false,
    canClientDownload: false,
  };

  it.each([
    {
      name: "proof",
      input: { skipProof: false, finalsPublishedAt: null, order: null },
      allowed: {
        canEditPricing: true,
        canEditClientMessage: true,
        canEditProofPhotos: true,
        canClientSubmit: true,
      },
    },
    {
      name: "submitted, awaiting payment",
      input: {
        skipProof: false,
        finalsPublishedAt: null,
        order: { status: "pending_payment" as const },
      },
      allowed: { canReopen: true, canMarkPaid: true },
    },
    {
      name: "paid, awaiting finals",
      input: {
        skipProof: false,
        finalsPublishedAt: null,
        order: { status: "paid" as const },
      },
      allowed: {
        canUploadFinals: true,
        canDeleteFinals: true,
        canPublishFinals: true,
        canEditFinalsPage: true,
      },
    },
    {
      name: "paid and delivered",
      input: {
        skipProof: false,
        finalsPublishedAt: published,
        order: { status: "paid" as const },
      },
      // More finals can still be added after publishing, but not removed.
      allowed: {
        canUploadFinals: true,
        canEditFinalsPage: true,
        canClientDownload: true,
      },
    },
    {
      name: "skip-proof, awaiting finals",
      input: { skipProof: true, finalsPublishedAt: null, order: null },
      allowed: {
        canUploadFinals: true,
        canDeleteFinals: true,
        canPublishFinals: true,
        canEditFinalsPage: true,
      },
    },
    {
      name: "skip-proof, delivered",
      input: { skipProof: true, finalsPublishedAt: published, order: null },
      // More finals can still be added after publishing, but not removed.
      allowed: {
        canUploadFinals: true,
        canEditFinalsPage: true,
        canClientDownload: true,
      },
    },
  ])("$name", ({ input, allowed }) => {
    expect(getGalleryPermissions(input)).toEqual({ ...none, ...allowed });
  });
});

describe("getClientView", () => {
  it.each([
    {
      name: "proof gallery → proof selection",
      input: { skipProof: false, finalsPublishedAt: null, order: null },
      view: "selection",
    },
    {
      name: "submitted, awaiting payment → submitted summary",
      input: {
        skipProof: false,
        finalsPublishedAt: null,
        order: { status: "pending_payment" as const },
      },
      view: "submitted",
    },
    {
      name: "paid, finals not published → still the submitted summary",
      input: {
        skipProof: false,
        finalsPublishedAt: null,
        order: { status: "paid" as const },
      },
      view: "submitted",
    },
    {
      name: "skip-proof, finals not published → photos on their way",
      input: { skipProof: true, finalsPublishedAt: null, order: null },
      view: "finalsComingSoon",
    },
    {
      name: "paid and delivered → finals",
      input: {
        skipProof: false,
        finalsPublishedAt: published,
        order: { status: "paid" as const },
      },
      view: "finals",
    },
    {
      name: "skip-proof delivered → finals",
      input: { skipProof: true, finalsPublishedAt: published, order: null },
      view: "finals",
    },
  ])("$name", ({ input, view }) => {
    expect(getClientView(input)).toBe(view);
  });
});
