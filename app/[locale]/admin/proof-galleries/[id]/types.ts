// Shapes the detail page serializes down to the gallery screen and its
// stage panels.

export type Gallery = {
  id: string;
  token: string;
  clientName: string;
  baseCostCents: number;
  freePhotoCount: number;
  extraPhotoPriceCents: number;
  currency: string;
  message: string | null;
  skipProof: boolean;
};

export type ProofPhoto = {
  id: string;
  fileName: string;
  cardSrc: string;
  selected: boolean;
  rating: "rather_no" | "rather_yes" | null;
  comment: string | null;
};

export type Order = {
  includedCount: number;
  extraCount: number;
  totalCents: number;
  submittedAtLabel: string;
  status: "pending_payment" | "paid";
  paidAtLabel: string | null;
};

export type FinalPhoto = {
  id: string;
  fileName: string;
  sizeBytes: number;
  previewCloudflareId: string;
  width: number | null;
  height: number | null;
};
