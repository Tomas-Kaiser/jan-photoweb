import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { clients } from "@/app/db/schema";
import { createEmailPreferencesLink } from "@/app/lib/email-preferences-link";
import { MARKETING_CONSENT_VERSIONS } from "@/app/lib/marketing-consent";
import type { ProofLinkLocale } from "@/app/lib/proof-link";

// The no-login "Manage email preferences" page behind the signed link in
// every client email. The signing rules are in
// app/lib/email-preferences-link.ts; this is the database side of them.

// Created per call rather than at import, so a missing secret fails the
// request that needs it instead of every module that imports this one.
function emailPreferencesLink() {
  return createEmailPreferencesLink(process.env.EMAIL_PREFERENCES_SECRET ?? "");
}

export function getEmailPreferencesUrl({
  siteUrl,
  locale,
  email,
}: {
  siteUrl: string;
  locale: ProofLinkLocale;
  // Already normalised.
  email: string;
}) {
  return `${siteUrl.replace(/\/$/, "")}/${locale}/email-preferences?t=${emailPreferencesLink().sign(email)}`;
}

export type EmailPreferences =
  | { kind: "invalidLink" }
  // A validly signed address with no client record, e.g. a verification
  // email for a registration that was never finished.
  | { kind: "noClient"; email: string }
  | { kind: "found"; email: string; subscribed: boolean };

export async function loadEmailPreferences(
  token: unknown,
): Promise<EmailPreferences> {
  const email = emailPreferencesLink().verify(token);
  if (!email) return { kind: "invalidLink" };

  const [client] = await db
    .select({ marketingConsentAt: clients.marketingConsentAt })
    .from(clients)
    .where(eq(clients.email, email))
    .limit(1);

  if (!client) return { kind: "noClient", email };
  return { kind: "found", email, subscribed: client.marketingConsentAt !== null };
}

// Turning news & offers on records consent anew, with the wording on the
// preferences page; turning it off clears it. False for an invalid link.
export async function setMarketingConsent(
  token: unknown,
  subscribed: boolean,
): Promise<boolean> {
  const email = emailPreferencesLink().verify(token);
  if (!email) return false;

  await db
    .update(clients)
    .set(
      subscribed
        ? {
            marketingConsentAt: new Date(),
            marketingConsentVersion: MARKETING_CONSENT_VERSIONS.preferences,
          }
        : { marketingConsentAt: null, marketingConsentVersion: null },
    )
    .where(eq(clients.email, email));

  return true;
}
