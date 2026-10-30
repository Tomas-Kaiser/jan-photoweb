import { and, desc, eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/app/db";
import {
  clients,
  emailVerifications,
  galleryClients,
  proofGalleries,
} from "@/app/db/schema";
import {
  createEmailVerification,
  type VerifyOutcome,
} from "@/app/lib/email-verification";
import {
  getRegistrationRole,
  type RegistrationPurpose,
} from "@/app/lib/gallery-lifecycle";
import { getEmailPreferencesUrl } from "@/app/lib/email-preferences";
import { MARKETING_CONSENT_VERSIONS } from "@/app/lib/marketing-consent";
import { getProofLinkPath, type ProofLinkLocale } from "@/app/lib/proof-link";

// Client registration on a gallery: emails a magic link and a code, and on
// verification links the person to the gallery — as its single owner when
// they claim a gated gallery, otherwise as a guest signing up for news &
// offers. The verification rules are in app/lib/email-verification.ts; this
// is the database and email side of them.

// Created per call rather than at import, so a missing secret fails the
// registration request instead of every module that imports this one.
function emailVerification() {
  return createEmailVerification(process.env.EMAIL_VERIFICATION_SECRET ?? "");
}

export type StartResult =
  | { kind: "sent" | "pending"; verificationId: string }
  | { kind: "rateLimited"; retryAfterSeconds: number };

export async function startRegistration({
  purpose,
  gallery,
  name,
  email,
  locale,
  marketingConsent,
  resend,
  siteUrl,
}: {
  purpose: RegistrationPurpose;
  gallery: { id: string; token: string };
  name: string;
  // Already normalised.
  email: string;
  locale: ProofLinkLocale;
  marketingConsent: boolean;
  resend: boolean;
  siteUrl: string;
}): Promise<StartResult> {
  const now = new Date();
  // Built first, so a missing secret fails before anything is stored.
  const preferencesLink = getEmailPreferencesUrl({ siteUrl, locale, email });

  const [pending] = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.galleryId, gallery.id),
        eq(emailVerifications.email, email),
        // An owner's and a guest's verification for the same email are
        // separate, so neither one's code or consent leaks into the other.
        eq(emailVerifications.purpose, purpose),
      ),
    )
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);

  const outcome = emailVerification().requestVerification(
    { pending: pending ?? null, resend },
    now,
  );

  if (outcome.kind === "rateLimited") return outcome;

  // What the person entered this time wins, so unticking the consent box
  // and resubmitting is respected even when no new email goes out.
  const entered = {
    name,
    locale,
    marketingConsentVersion: marketingConsent
      ? MARKETING_CONSENT_VERSIONS[purpose]
      : null,
  };

  if (outcome.kind === "pending") {
    await db
      .update(emailVerifications)
      .set(entered)
      .where(eq(emailVerifications.id, pending.id));
    return { kind: "pending", verificationId: pending.id };
  }

  const details = { ...entered, ...outcome.record };

  const [saved] =
    outcome.replacesPending && pending
      ? await db
          .update(emailVerifications)
          .set(details)
          .where(eq(emailVerifications.id, pending.id))
          .returning({ id: emailVerifications.id })
      : await db
          .insert(emailVerifications)
          .values({ galleryId: gallery.id, email, purpose, ...details })
          .returning({ id: emailVerifications.id });

  const link = `${siteUrl.replace(/\/$/, "")}${getProofLinkPath(
    locale,
    gallery.token,
  )}?verify=${saved.id}.${outcome.secrets.linkToken}`;

  await sendVerificationEmail({
    purpose,
    to: email,
    name,
    locale,
    code: outcome.secrets.code,
    link,
    preferencesLink,
  });

  return { kind: "sent", verificationId: saved.id };
}

export type CompleteResult =
  // "joined": linked as a guest with news & offers consent.
  | { kind: "claimed" | "joined" | "alreadyClaimed" | "notFound" }
  | Exclude<VerifyOutcome, { ok: true }>;

// Verifies by code or link, then registers the person for the form the
// verification started from: the owner form claims the gallery if it's
// still gated and unclaimed, a guest signup links them as a guest (see
// getRegistrationRole). Runs under row locks on the gallery and the
// verification, so concurrent attempts are serialised: a verification is
// used once, and a gallery gets one owner (the partial unique index on
// gallery_clients backs this up).
export async function completeRegistration({
  galleryId,
  verificationId,
  proof,
}: {
  galleryId: string;
  verificationId: string;
  proof: { code: string } | { linkToken: string };
}): Promise<CompleteResult> {
  return db.transaction(async (tx) => {
    const now = new Date();

    const [gallery] = await tx
      .select({ requiresRegistration: proofGalleries.requiresRegistration })
      .from(proofGalleries)
      .where(eq(proofGalleries.id, galleryId))
      .for("update");

    const [verification] = await tx
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.id, verificationId),
          eq(emailVerifications.galleryId, galleryId),
        ),
      )
      .for("update");

    if (!gallery || !verification) return { kind: "notFound" as const };

    const { verifyCode, verifyLinkToken } = emailVerification();
    const outcome =
      "code" in proof
        ? verifyCode(verification, proof.code, now)
        : verifyLinkToken(verification, proof.linkToken, now);

    if (!outcome.ok) {
      if (outcome.reason === "wrong") {
        await tx
          .update(emailVerifications)
          .set({ attempts: verification.attempts + 1 })
          .where(eq(emailVerifications.id, verification.id));
      }
      return outcome;
    }

    await tx
      .update(emailVerifications)
      .set({ consumedAt: now })
      .where(eq(emailVerifications.id, verification.id));

    const [existingOwner] = await tx
      .select({ id: galleryClients.id })
      .from(galleryClients)
      .where(
        and(
          eq(galleryClients.galleryId, galleryId),
          eq(galleryClients.role, "owner"),
        ),
      )
      .limit(1);

    const role = getRegistrationRole({
      purpose: verification.purpose,
      gate: {
        required: gallery.requiresRegistration,
        claimed: Boolean(existingOwner),
      },
    });

    // A guest is only ever recorded with consent, which the start route
    // requires; without it there's nothing to sign up for.
    if (!role || (role === "guest" && !verification.marketingConsentVersion)) {
      return { kind: "alreadyClaimed" as const };
    }

    const consent = verification.marketingConsentVersion
      ? {
          marketingConsentAt: now,
          marketingConsentVersion: verification.marketingConsentVersion,
        }
      : {};

    // One client per email: an unticked box never clears earlier consent,
    // and a guest signup never renames an existing client — anyone with
    // the link can sign up with any address they can verify.
    const [client] = await tx
      .insert(clients)
      .values({
        email: verification.email,
        name: verification.name,
        locale: verification.locale,
        ...consent,
      })
      .onConflictDoUpdate({
        target: clients.email,
        set:
          role === "owner"
            ? {
                name: verification.name,
                locale: verification.locale,
                ...consent,
              }
            : consent,
      })
      .returning({ id: clients.id });

    const membership = tx
      .insert(galleryClients)
      .values({ galleryId, clientId: client.id, role });
    const membershipTarget = [
      galleryClients.galleryId,
      galleryClients.clientId,
    ];

    // Already linked: a guest claiming the gallery becomes its owner, and
    // an owner signing up as a guest stays the owner.
    if (role === "owner") {
      await membership.onConflictDoUpdate({
        target: membershipTarget,
        set: { role },
      });
      return { kind: "claimed" as const };
    }

    await membership.onConflictDoNothing({ target: membershipTarget });
    return { kind: "joined" as const };
  });
}

const VERIFICATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVerificationId(value: unknown): value is string {
  return typeof value === "string" && VERIFICATION_ID_PATTERN.test(value);
}

// Which form an emailed link belongs to, so the page hands it to that
// form's screen only: an owner's link opened on the finals (the gallery's
// open by then) or a guest's on the registration screen is left alone.
// Null for an unknown id.
export async function findLinkVerificationPurpose({
  galleryId,
  verificationId,
}: {
  galleryId: string;
  verificationId: string;
}): Promise<RegistrationPurpose | null> {
  if (!isVerificationId(verificationId)) return null;

  const [verification] = await db
    .select({ purpose: emailVerifications.purpose })
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.id, verificationId),
        eq(emailVerifications.galleryId, galleryId),
      ),
    )
    .limit(1);

  return verification?.purpose ?? null;
}

async function sendVerificationEmail({
  purpose,
  to,
  name,
  locale,
  code,
  link,
  preferencesLink,
}: {
  purpose: RegistrationPurpose;
  to: string;
  name: string;
  locale: ProofLinkLocale;
  code: string;
  link: string;
  preferencesLink: string;
}) {
  const subject =
    locale === "cs"
      ? `Váš ověřovací kód: ${code}`
      : `Your verification code: ${code}`;

  const text =
    locale === "cs"
      ? [
          `Dobrý den, ${name},`,
          "",
          purpose === "owner"
            ? "pro zobrazení vašich fotek potvrďte svůj e-mail. Klikněte na odkaz:"
            : "pro odběr novinek a nabídek potvrďte svůj e-mail. Klikněte na odkaz:",
          link,
          "",
          `nebo zadejte tento kód na stránce galerie: ${code}`,
          "",
          "Odkaz i kód platí 15 minut a lze je použít jen jednou.",
          "Pokud jste o nic nežádali, tento e-mail můžete ignorovat.",
          "",
          "Jan Hájek",
          "",
          `Nastavení e-mailů: ${preferencesLink}`,
        ].join("\n")
      : [
          `Hi ${name},`,
          "",
          purpose === "owner"
            ? "Please confirm your email to see your photos. Click this link:"
            : "Please confirm your email to get news and offers. Click this link:",
          link,
          "",
          `or enter this code on the gallery page: ${code}`,
          "",
          "The link and the code are valid for 15 minutes and work once.",
          "If you didn't ask for this, you can ignore this email.",
          "",
          "Jan Hájek",
          "",
          `Manage email preferences: ${preferencesLink}`,
        ].join("\n");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  });
}
