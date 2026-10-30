// The admin contacts screen's view of clients, and the CSV export of
// consenting contacts for the external newsletter tool. Pure: the page and
// the export route load the rows.

import type { GalleryEventType } from "@/app/lib/gallery-event-type";

export type ContactGallery = {
  id: string;
  clientName: string;
  eventType: GalleryEventType | null;
  role: "owner" | "guest";
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  locale: string;
  marketingConsentAt: Date | null;
  galleries: ContactGallery[];
};

export type ContactRow = {
  client: Omit<Contact, "galleries">;
  // Null for a client left with no galleries (a consenting contact kept
  // after teardown), from the left join.
  gallery: ContactGallery | null;
};

// Folds client × gallery join rows into one contact per client, keeping the
// rows' order for both the contacts and each one's galleries.
export function groupContacts(rows: ContactRow[]): Contact[] {
  const byId = new Map<string, Contact>();
  for (const { client, gallery } of rows) {
    let contact = byId.get(client.id);
    if (!contact) {
      contact = { ...client, galleries: [] };
      byId.set(client.id, contact);
    }
    if (gallery) contact.galleries.push(gallery);
  }
  return [...byId.values()];
}

export function hasMarketingConsent(
  contact: Contact,
): contact is Contact & { marketingConsentAt: Date } {
  return contact.marketingConsentAt !== null;
}

export function ownsAGallery(contact: Contact): boolean {
  return contact.galleries.some((g) => g.role === "owner");
}

// Each event type across the person's galleries once, in gallery order.
export function getContactEventTypes(contact: Contact): GalleryEventType[] {
  const types = contact.galleries.flatMap((g) =>
    g.eventType ? [g.eventType] : [],
  );
  return [...new Set(types)];
}

const CSV_HEADER = ["name", "email", "locale", "event types", "consent date"];

export function buildContactsCsv(contacts: Contact[]): string {
  const rows = contacts
    .filter(hasMarketingConsent)
    .map((c) => [
      c.name,
      c.email,
      c.locale,
      getContactEventTypes(c).join(";"),
      c.marketingConsentAt.toISOString(),
    ]);

  return [CSV_HEADER, ...rows]
    .map((row) => row.map(csvField).join(",") + "\r\n")
    .join("");
}

// RFC 4180 quoting. Names are typed in by the public, so a leading formula
// character is neutralised before the file is opened in a spreadsheet.
function csvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) || safe !== value
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}
