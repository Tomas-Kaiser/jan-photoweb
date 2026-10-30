// Where a proof gallery is in its lifecycle, derived only from the gallery
// and its order — the single place that combines `skipProof`, the order's
// status and `finalsPublishedAt`. Pure: no DB or network access, so both
// server and client components (and later the API routes) can share it.

export type GalleryStage = "proof" | "submitted" | "awaitingFinals" | "delivered";

export type GalleryLifecycleInput = {
  skipProof: boolean;
  // Date on the server, ISO string once serialized to a client component.
  finalsPublishedAt: Date | string | null;
  order: { status: "pending_payment" | "paid" } | null;
};

export function getGalleryStage({
  skipProof,
  finalsPublishedAt,
  order,
}: GalleryLifecycleInput): GalleryStage {
  if (finalsPublishedAt) return "delivered";
  // Direct delivery (skipProof) has no selection or payment, so it starts
  // where a paid gallery would be.
  if (skipProof || order?.status === "paid") return "awaitingFinals";
  if (order) return "submitted";
  return "proof";
}

export type GalleryPermissions = {
  // Admin
  canEditPricing: boolean;
  canEditClientMessage: boolean;
  // Adding and deleting proof photos.
  canEditProofPhotos: boolean;
  canReopen: boolean;
  canMarkPaid: boolean;
  // Finals can still be added after publishing (they appear for the client
  // right away), but no longer removed.
  canUploadFinals: boolean;
  canDeleteFinals: boolean;
  canPublishFinals: boolean;
  // Event date, finals message and hero photos — editable from the moment
  // finals can be delivered, including after publishing.
  canEditFinalsPage: boolean;
  // Client. Downloading finals also depends on the registration gate, so
  // it comes from getClientView instead.
  canClientSubmit: boolean;
};

export function getGalleryPermissions(
  input: GalleryLifecycleInput,
): GalleryPermissions {
  const stage = getGalleryStage(input);

  return {
    canEditPricing: stage === "proof",
    canEditClientMessage: stage === "proof",
    canEditProofPhotos: stage === "proof",
    canReopen: stage === "submitted",
    canMarkPaid: stage === "submitted",
    canUploadFinals: stage === "awaitingFinals" || stage === "delivered",
    canDeleteFinals: stage === "awaitingFinals",
    canPublishFinals: stage === "awaitingFinals",
    canEditFinalsPage: stage === "awaitingFinals" || stage === "delivered",
    canClientSubmit: stage === "proof",
  };
}

// What the client sees at their gallery link.
export type ClientView =
  | "selection"
  | "submitted"
  | "finalsComingSoon"
  // Published finals behind the owner registration gate: the first person
  // to verify their email claims the gallery, then it opens to everyone.
  | "registration"
  | "finals";

export type RegistrationGate = {
  // The gallery's requires-registration flag.
  required: boolean;
  // Whether someone has claimed the gallery as its owner.
  claimed: boolean;
};

// Only the finals are gated — proof selection never is.
export function getClientView(
  input: GalleryLifecycleInput,
  registration: RegistrationGate,
): ClientView {
  switch (getGalleryStage(input)) {
    case "proof":
      return "selection";
    case "submitted":
      return "submitted";
    case "awaitingFinals":
      // A paid client keeps seeing their submitted selection until finals
      // are published; direct delivery has no selection to show.
      return input.skipProof ? "finalsComingSoon" : "submitted";
    case "delivered":
      return registration.required && !registration.claimed
        ? "registration"
        : "finals";
  }
}
