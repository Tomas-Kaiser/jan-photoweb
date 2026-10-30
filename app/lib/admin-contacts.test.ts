import { describe, expect, it } from "vitest";
import {
  buildContactsCsv,
  groupContacts,
  type Contact,
} from "./admin-contacts";

function contact(overrides: Partial<Contact>): Contact {
  return {
    id: "c1",
    name: "Jana Nováková",
    email: "jana@example.com",
    locale: "cs",
    marketingConsentAt: null,
    galleries: [],
    ...overrides,
  };
}

describe("buildContactsCsv", () => {
  it("exports only contacts who consented to news & offers", () => {
    const csv = buildContactsCsv([
      contact({
        id: "a",
        name: "Anna",
        email: "anna@example.com",
        locale: "en",
        marketingConsentAt: new Date("2026-10-01T12:30:00Z"),
      }),
      contact({ id: "b", name: "Bob", email: "bob@example.com" }),
    ]);

    expect(csv).toBe(
      "name,email,locale,event types,consent date\r\n" +
        "Anna,anna@example.com,en,,2026-10-01T12:30:00.000Z\r\n",
    );
  });

  it("lists each event type of the person's galleries once", () => {
    const csv = buildContactsCsv([
      contact({
        marketingConsentAt: new Date("2026-10-01T12:30:00Z"),
        galleries: [
          { id: "g1", clientName: "Wedding", eventType: "wedding", role: "owner" },
          { id: "g2", clientName: "Family", eventType: "family", role: "guest" },
          { id: "g3", clientName: "Untyped", eventType: null, role: "guest" },
          { id: "g4", clientName: "Another", eventType: "wedding", role: "guest" },
        ],
      }),
    ]);

    expect(csv.split("\r\n")[1]).toBe(
      "Jana Nováková,jana@example.com,cs,wedding;family,2026-10-01T12:30:00.000Z",
    );
  });

  it("quotes values containing commas, quotes or line breaks", () => {
    const csv = buildContactsCsv([
      contact({
        name: 'Novák, "Honza"\nJr.',
        marketingConsentAt: new Date("2026-10-01T12:30:00Z"),
      }),
    ]);

    expect(csv).toContain('"Novák, ""Honza""\nJr.",jana@example.com');
  });

  it("stops a name from running as a spreadsheet formula", () => {
    const csv = buildContactsCsv([
      contact({
        name: "=HYPERLINK(\"x\")",
        marketingConsentAt: new Date("2026-10-01T12:30:00Z"),
      }),
    ]);

    expect(csv.split("\r\n")[1]).toMatch(/^"'=HYPERLINK\(""x""\)",/);
  });
});

describe("groupContacts", () => {
  const anna = {
    id: "a",
    name: "Anna",
    email: "anna@example.com",
    locale: "en",
    marketingConsentAt: null,
  };

  it("gives one contact per person with each gallery and their role in it", () => {
    expect(
      groupContacts([
        {
          client: anna,
          gallery: { id: "g1", clientName: "Smith wedding", eventType: "wedding", role: "owner" },
        },
        {
          client: anna,
          gallery: { id: "g2", clientName: "Lee family", eventType: null, role: "guest" },
        },
      ]),
    ).toEqual([
      {
        ...anna,
        galleries: [
          { id: "g1", clientName: "Smith wedding", eventType: "wedding", role: "owner" },
          { id: "g2", clientName: "Lee family", eventType: null, role: "guest" },
        ],
      },
    ]);
  });

  it("keeps a person with no galleries left", () => {
    expect(groupContacts([{ client: anna, gallery: null }])).toEqual([
      { ...anna, galleries: [] },
    ]);
  });
});
