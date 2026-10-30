import { describe, expect, it } from "vitest";
import {
  getClientView,
  getGalleryPermissions,
  getGalleryStage,
  getRegistrationRole,
} from "@/app/lib/gallery-lifecycle";

const published = new Date("2026-05-01T10:00:00Z");
const ungated = { required: false, claimed: false };

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
    expect(getClientView(input, ungated)).toBe(view);
  });
});

describe("getClientView with the registration gate", () => {
  const delivered = {
    skipProof: false,
    finalsPublishedAt: published,
    order: { status: "paid" as const },
  };

  it("shows the registration screen instead of the finals until the gallery is claimed", () => {
    expect(
      getClientView(delivered, { required: true, claimed: false }),
    ).toBe("registration");
    expect(
      getClientView(
        { skipProof: true, finalsPublishedAt: published, order: null },
        { required: true, claimed: false },
      ),
    ).toBe("registration");
  });

  it("opens the finals to anyone with the link once claimed", () => {
    expect(getClientView(delivered, { required: true, claimed: true })).toBe(
      "finals",
    );
  });

  it("never gates proof selection or anything before finals are published", () => {
    const gate = { required: true, claimed: false };

    expect(
      getClientView(
        { skipProof: false, finalsPublishedAt: null, order: null },
        gate,
      ),
    ).toBe("selection");
    expect(
      getClientView(
        {
          skipProof: false,
          finalsPublishedAt: null,
          order: { status: "paid" as const },
        },
        gate,
      ),
    ).toBe("submitted");
    expect(
      getClientView(
        { skipProof: true, finalsPublishedAt: null, order: null },
        gate,
      ),
    ).toBe("finalsComingSoon");
  });
});

describe("getRegistrationRole", () => {
  const unclaimed = { required: true, claimed: false };
  const claimed = { required: true, claimed: true };

  it("makes the first verified person from the owner form on a gated, unclaimed gallery its owner", () => {
    expect(getRegistrationRole({ purpose: "owner", gate: unclaimed })).toBe(
      "owner",
    );
  });

  it("registers nothing for an owner form verified once there's nothing to claim, even with consent", () => {
    // e.g. an owner's link verified after someone else claimed it.
    expect(getRegistrationRole({ purpose: "owner", gate: claimed })).toBe(null);
    expect(getRegistrationRole({ purpose: "owner", gate: ungated })).toBe(null);
  });

  it("always links a guest signup as a guest, never as the owner", () => {
    for (const gate of [unclaimed, claimed, ungated]) {
      expect(getRegistrationRole({ purpose: "guest", gate })).toBe("guest");
    }
  });
});
