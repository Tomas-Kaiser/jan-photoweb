import { describe, expect, it } from "vitest";
import { createEmailPreferencesLink } from "@/app/lib/email-preferences-link";

const SECRET = "test-secret";
const links = createEmailPreferencesLink(SECRET);

describe("email preferences link", () => {
  it("verifies a token back to the email it was signed for", () => {
    const token = links.sign("jana@example.com");

    expect(links.verify(token)).toBe("jana@example.com");
  });

  it("rejects a token signed with a different secret", () => {
    const token = createEmailPreferencesLink("other-secret").sign(
      "jana@example.com",
    );

    expect(links.verify(token)).toBeNull();
  });

  it("rejects another email carrying a valid token's signature", () => {
    const [, signature] = links.sign("jana@example.com").split(".");
    const [otherEmail] = links.sign("petr@example.com").split(".");

    expect(links.verify(`${otherEmail}.${signature}`)).toBeNull();
  });

  it("rejects a token whose signature was altered", () => {
    const token = links.sign("jana@example.com");
    const altered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;

    expect(links.verify(altered)).toBeNull();
  });

  it.each([
    ["nothing", undefined],
    ["an empty string", ""],
    ["a token without a signature", "amFuYUBleGFtcGxlLmNvbQ"],
    ["a token with an empty signature", "amFuYUBleGFtcGxlLmNvbQ."],
    ["a repeated query parameter", ["a.b", "c.d"]],
  ])("rejects %s", (_label, token) => {
    expect(links.verify(token)).toBeNull();
  });

  it("rejects a valid token with extra parts appended", () => {
    expect(links.verify(`${links.sign("jana@example.com")}.extra`)).toBeNull();
  });

  it("refuses to sign without a server secret", () => {
    expect(() => createEmailPreferencesLink("")).toThrow();
  });
});
