// Identifies the wording of each news & offers checkbox in
// messages/*.json. Bump a box's version whenever its wording changes, so
// each stored consent records the wording the person actually agreed to.
export const MARKETING_CONSENT_VERSIONS = {
  // proof.registration.marketingTitle, marketingText, marketingConsent and
  // marketingNote — optional, on the owner form.
  owner: "2026-11-01",
  // proof.guestSignup.marketingConsent — required, on the guest box.
  guest: "guest-2026-10-30",
  // emailPreferences.consent — shown when turning news & offers back on
  // from the "Manage email preferences" page.
  preferences: "preferences-2026-10-30",
} as const;

// What a client's consent fields are set to when news & offers is turned
// off, by the client or by the admin.
export const NO_MARKETING_CONSENT = {
  marketingConsentAt: null,
  marketingConsentVersion: null,
} as const;
