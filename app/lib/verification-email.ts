import type { RegistrationPurpose } from "@/app/lib/gallery-lifecycle";
import type { ProofLinkLocale } from "@/app/lib/proof-link";

// The email with a registration's magic link and code. The HTML part hides
// the long link behind a button; the text part is the fallback for mail
// clients that don't show HTML, so it has to spell the link out.

export type VerificationEmailInput = {
  purpose: RegistrationPurpose;
  name: string;
  locale: ProofLinkLocale;
  code: string;
  link: string;
  preferencesLink: string;
};

const COPY = {
  cs: {
    subject: "Váš ověřovací kód",
    greeting: "Dobrý den",
    intro: {
      owner: "pro zobrazení vašich fotek potvrďte svůj e-mail.",
      guest: "pro odběr novinek a nabídek potvrďte svůj e-mail.",
    },
    clickLink: "Klikněte na odkaz:",
    button: "Potvrdit e-mail",
    enterCode: "nebo zadejte tento kód na stránce galerie:",
    validity: "Odkaz i kód platí 15 minut a lze je použít jen jednou.",
    ignore: "Pokud jste o nic nežádali, tento e-mail můžete ignorovat.",
    preferences: "Nastavení e-mailů",
  },
  en: {
    subject: "Your verification code",
    greeting: "Hi",
    intro: {
      owner: "Please confirm your email to see your photos.",
      guest: "Please confirm your email to get news and offers.",
    },
    clickLink: "Click this link:",
    button: "Confirm my email",
    enterCode: "or enter this code on the gallery page:",
    validity: "The link and the code are valid for 15 minutes and work once.",
    ignore: "If you didn't ask for this, you can ignore this email.",
    preferences: "Manage email preferences",
  },
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderVerificationEmail({
  purpose,
  name,
  locale,
  code,
  link,
  preferencesLink,
}: VerificationEmailInput) {
  const copy = COPY[locale];

  const text = [
    `${copy.greeting}, ${name},`,
    "",
    `${copy.intro[purpose]} ${copy.clickLink}`,
    link,
    "",
    `${copy.enterCode} ${code}`,
    "",
    copy.validity,
    copy.ignore,
    "",
    "Jan Hájek",
    "",
    `${copy.preferences}: ${preferencesLink}`,
  ].join("\n");

  // Inline styles and a plain <a>: mail clients drop stylesheets.
  const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5; color: #222222; max-width: 480px;">
  <p>${escapeHtml(copy.greeting)}, ${escapeHtml(name)},</p>
  <p>${escapeHtml(copy.intro[purpose])}</p>
  <p style="margin: 24px 0;"><a href="${escapeHtml(link)}" style="display: inline-block; padding: 12px 24px; background-color: #222222; color: #ffffff; text-decoration: none; border-radius: 4px;">${escapeHtml(copy.button)}</a></p>
  <p>${escapeHtml(copy.enterCode)} <strong style="letter-spacing: 2px;">${escapeHtml(code)}</strong></p>
  <p>${escapeHtml(copy.validity)}<br>${escapeHtml(copy.ignore)}</p>
  <p>Jan Hájek</p>
  <p style="font-size: 13px;"><a href="${escapeHtml(preferencesLink)}" style="color: #666666;">${escapeHtml(copy.preferences)}</a></p>
</div>`;

  return { subject: `${copy.subject}: ${code}`, text, html };
}
