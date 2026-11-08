import { describe, expect, it } from "vitest";
import {
  renderVerificationEmail,
  type VerificationEmailInput,
} from "@/app/lib/verification-email";

const LINK = "https://example.com/en/proof/abc?verify=id.s3cr3t-t0ken";
const PREFERENCES_LINK = "https://example.com/en/email-preferences?t=signed";

const input: VerificationEmailInput = {
  purpose: "owner",
  name: "Jana",
  locale: "en",
  code: "123456",
  link: LINK,
  preferencesLink: PREFERENCES_LINK,
};

function visibleText(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

describe("verification email", () => {
  it("hides the magic link behind a button in the HTML part", () => {
    const { html } = renderVerificationEmail(input);

    expect(html).toContain(`href="${LINK}"`);
    expect(visibleText(html)).toContain("Confirm my email");
    expect(visibleText(html)).not.toContain("s3cr3t-t0ken");
  });

  it("hides the preferences link behind its label in the HTML part", () => {
    const { html } = renderVerificationEmail(input);

    expect(html).toContain(`href="${PREFERENCES_LINK}"`);
    expect(visibleText(html)).toContain("Manage email preferences");
    expect(visibleText(html)).not.toContain(PREFERENCES_LINK);
  });

  it("spells both links out in the text fallback", () => {
    const { text } = renderVerificationEmail(input);

    expect(text).toContain(LINK);
    expect(text).toContain(PREFERENCES_LINK);
  });

  it("shows the code in the subject and both parts", () => {
    const { subject, text, html } = renderVerificationEmail(input);

    expect(subject).toBe("Your verification code: 123456");
    expect(text).toContain("123456");
    expect(visibleText(html)).toContain("123456");
  });

  it("escapes a name containing HTML", () => {
    const { html } = renderVerificationEmail({
      ...input,
      name: '<a href="https://evil.example">Jana</a>',
    });

    expect(html).not.toContain('<a href="https://evil.example"');
    expect(html).toContain("&lt;a href=");
  });

  it("uses the recipient's locale and the form's purpose", () => {
    const { subject, text, html } = renderVerificationEmail({
      ...input,
      locale: "cs",
      purpose: "guest",
    });

    expect(subject).toBe("Váš ověřovací kód: 123456");
    expect(text).toContain("pro odběr novinek a nabídek");
    expect(visibleText(html)).toContain("Potvrdit e-mail");
  });
});
