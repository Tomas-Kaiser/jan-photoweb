// What a visitor can pick on the contact form. The ids double as the
// `?service=` values the homepage and Services page link with, and as the
// keys under contact.form.enquiryTypes and .drafts in messages/*.json.
export const CONTACT_ENQUIRY_TYPES = [
  "couples",
  "wedding",
  "portrait",
  "personal-workshops",
  "voucher",
  "other",
] as const;

export type ContactEnquiryType = (typeof CONTACT_ENQUIRY_TYPES)[number];

export function isContactEnquiryType(
  value: string | null | undefined,
): value is ContactEnquiryType {
  return CONTACT_ENQUIRY_TYPES.includes(value as ContactEnquiryType);
}
