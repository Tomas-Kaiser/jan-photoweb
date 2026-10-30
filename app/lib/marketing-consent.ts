// Identifies the wording of each news & offers checkbox in
// messages/*.json. Bump a box's version whenever its wording changes, so
// each stored consent records the wording the person actually agreed to.
export const MARKETING_CONSENT_VERSIONS = {
  // proof.registration.marketingConsent — optional, on the owner form.
  owner: "2026-10-30",
  // proof.guestSignup.marketingConsent — required, on the guest box.
  guest: "guest-2026-10-30",
} as const;
