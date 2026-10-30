import { and, desc, eq, gt, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/app/db";
import {
  clients,
  emailVerifications,
  galleryClients,
  proofGalleries,
} from "@/app/db/schema";
import {
  requestVerification,
  verifyCode,
  verifyLinkToken,
  type VerifyOutcome,
} from "@/app/lib/email-verification";
import { MARKETING_CONSENT_VERSION } from "@/app/lib/marketing-consent";
import { getProofLinkPath, type ProofLinkLocale } from "@/app/lib/proof-link";

// Owner registration on a gated gallery: emails a magic link and a code,
// and on verification makes the person the gallery's single owner. The
// verification rules are in app/lib/email-verification.ts; this is the
// database and email side of them.

export type StartResult =
  | { kind: "sent" | "pending"; verificationId: string }
  | { kind: "rateLimited"; retryAfterSeconds: number | null };

export async function startOwnerRegistration({
  gallery,
  name,
  email,
  locale,
  marketingConsent,
  resend,
  siteUrl,
}: {
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

  const [pending] = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.galleryId, gallery.id),
        eq(emailVerifications.email, email),
      ),
    )
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);

  const [{ startsInLastHour }] = await db
    .select({ startsInLastHour: sql<number>`count(*)::int` })
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.galleryId, gallery.id),
        gt(
          emailVerifications.createdAt,
          new Date(now.getTime() - 60 * 60_000),
        ),
      ),
    );

  const outcome = requestVerification(
    { pending: pending ?? null, startsInLastHour, resend },
    now,
  );

  if (outcome.kind === "rateLimited") return outcome;

  // What the person entered this time wins, so unticking the consent box
  // and resubmitting is respected even when no new email goes out.
  const entered = {
    name,
    locale,
    marketingConsentVersion: marketingConsent ? MARKETING_CONSENT_VERSION : null,
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
          .values({ galleryId: gallery.id, email, ...details })
          .returning({ id: emailVerifications.id });

  const link = `${siteUrl.replace(/\/$/, "")}${getProofLinkPath(
    locale,
    gallery.token,
  )}?verify=${saved.id}.${outcome.secrets.linkToken}`;

  await sendVerificationEmail({
    to: email,
    name,
    locale,
    code: outcome.secrets.code,
    link,
  });

  return { kind: "sent", verificationId: saved.id };
}

export type CompleteResult =
  | { kind: "claimed" | "alreadyClaimed" | "notFound" }
  | Exclude<VerifyOutcome, { ok: true }>;

// Verifies by code or link and claims the gallery. Runs under row locks on
// the gallery and the verification, so concurrent attempts are serialised:
// a verification is used once, and a gallery gets one owner (the partial
// unique index on gallery_clients backs this up).
export async function completeOwnerRegistration({
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

    await tx
      .select({ id: proofGalleries.id })
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

    if (!verification) return { kind: "notFound" as const };

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

    // Someone else claimed it first. The gallery is open to everyone now,
    // so there's nothing left to register for.
    if (existingOwner) return { kind: "alreadyClaimed" as const };

    const consent = verification.marketingConsentVersion
      ? {
          marketingConsentAt: now,
          marketingConsentVersion: verification.marketingConsentVersion,
        }
      : {};

    // One client per email: an unticked box never clears earlier consent.
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
        set: {
          name: verification.name,
          locale: verification.locale,
          ...consent,
        },
      })
      .returning({ id: clients.id });

    await tx
      .insert(galleryClients)
      .values({ galleryId, clientId: client.id, role: "owner" });

    return { kind: "claimed" as const };
  });
}

async function sendVerificationEmail({
  to,
  name,
  locale,
  code,
  link,
}: {
  to: string;
  name: string;
  locale: ProofLinkLocale;
  code: string;
  link: string;
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
          "pro zobrazení vašich fotek potvrďte svůj e-mail. Klikněte na odkaz:",
          link,
          "",
          `nebo zadejte tento kód na stránce galerie: ${code}`,
          "",
          "Odkaz i kód platí 15 minut a lze je použít jen jednou.",
          "Pokud jste o nic nežádali, tento e-mail můžete ignorovat.",
          "",
          "Jan Hájek",
        ].join("\n")
      : [
          `Hi ${name},`,
          "",
          "Please confirm your email to see your photos. Click this link:",
          link,
          "",
          `or enter this code on the gallery page: ${code}`,
          "",
          "The link and the code are valid for 15 minutes and work once.",
          "If you didn't ask for this, you can ignore this email.",
          "",
          "Jan Hájek",
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
