import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/app/db";
import { clients, galleryClients, proofGalleries } from "@/app/db/schema";
import {
  getDueDeletionReminder,
  type DeletionReminder,
} from "@/app/lib/deletion-reminders";
import { getEmailPreferencesUrl } from "@/app/lib/email-preferences";
import { getFinalDeliveryDeletionDate } from "@/app/lib/final-delivery-retention";
import { getProofLinkPath, type ProofLinkLocale } from "@/app/lib/proof-link";

// Emails each claimed gallery's owner the deletion reminder they're due
// (rules in app/lib/deletion-reminders.ts), run by the daily deletion
// cron. Guests and unclaimed galleries get none. One gallery's failure
// never stops the others.

function recordSent(reminder: DeletionReminder, sentAt: Date | null) {
  return reminder === 30
    ? { deletionReminder30SentAt: sentAt }
    : { deletionReminder7SentAt: sentAt };
}

function sentAtColumn(reminder: DeletionReminder) {
  return reminder === 30
    ? proofGalleries.deletionReminder30SentAt
    : proofGalleries.deletionReminder7SentAt;
}

export async function sendDueDeletionReminders({
  siteUrl,
  now = new Date(),
}: {
  siteUrl: string;
  now?: Date;
}): Promise<{ sent: string[]; failed: string[] }> {
  const galleries = await db
    .select({
      id: proofGalleries.id,
      token: proofGalleries.token,
      finalsPublishedAt: proofGalleries.finalsPublishedAt,
      reminder30SentAt: proofGalleries.deletionReminder30SentAt,
      reminder7SentAt: proofGalleries.deletionReminder7SentAt,
      email: clients.email,
      name: clients.name,
      locale: clients.locale,
    })
    .from(proofGalleries)
    .innerJoin(
      galleryClients,
      and(
        eq(galleryClients.galleryId, proofGalleries.id),
        eq(galleryClients.role, "owner"),
      ),
    )
    .innerJoin(clients, eq(clients.id, galleryClients.clientId))
    .where(
      and(
        isNotNull(proofGalleries.finalsPublishedAt),
        or(
          isNull(proofGalleries.deletionReminder30SentAt),
          isNull(proofGalleries.deletionReminder7SentAt),
        ),
      ),
    );

  const sent: string[] = [];
  const failed: string[] = [];

  for (const gallery of galleries) {
    if (!gallery.finalsPublishedAt) continue;
    const reminder = getDueDeletionReminder(
      {
        finalsPublishedAt: gallery.finalsPublishedAt,
        reminder30SentAt: gallery.reminder30SentAt,
        reminder7SentAt: gallery.reminder7SentAt,
      },
      now,
    );
    if (!reminder) continue;

    // Recorded before sending, and only if still unrecorded, so two
    // overlapping cron runs can't both send it.
    const [claimed] = await db
      .update(proofGalleries)
      .set(recordSent(reminder, now))
      .where(
        and(
          eq(proofGalleries.id, gallery.id),
          isNull(sentAtColumn(reminder)),
        ),
      )
      .returning({ id: proofGalleries.id });
    if (!claimed) continue;

    try {
      const locale: ProofLinkLocale = gallery.locale === "cs" ? "cs" : "en";
      await sendDeletionReminderEmail({
        reminder,
        to: gallery.email,
        name: gallery.name,
        locale,
        galleryLink: `${siteUrl.replace(/\/$/, "")}${getProofLinkPath(
          locale,
          gallery.token,
        )}`,
        deletionDateLabel: getFinalDeliveryDeletionDate(
          gallery.finalsPublishedAt,
        ).toLocaleDateString(locale, {
          dateStyle: "long",
          timeZone: "Europe/Prague",
        }),
        preferencesLink: getEmailPreferencesUrl({
          siteUrl,
          locale,
          email: gallery.email,
        }),
      });
      sent.push(gallery.id);
    } catch (error) {
      console.error("Failed to send deletion reminder:", {
        galleryId: gallery.id,
        reminder,
        error,
      });
      // Unrecorded again, so the next run retries it.
      await db
        .update(proofGalleries)
        .set(recordSent(reminder, null))
        .where(eq(proofGalleries.id, gallery.id))
        .catch((resetError) =>
          console.error("Failed to reset deletion reminder:", {
            galleryId: gallery.id,
            reminder,
            error: resetError,
          }),
        );
      failed.push(gallery.id);
    }
  }

  return { sent, failed };
}

async function sendDeletionReminderEmail({
  reminder,
  to,
  name,
  locale,
  galleryLink,
  deletionDateLabel,
  preferencesLink,
}: {
  reminder: DeletionReminder;
  to: string;
  name: string;
  locale: ProofLinkLocale;
  galleryLink: string;
  deletionDateLabel: string;
  preferencesLink: string;
}) {
  const subject =
    locale === "cs"
      ? `Vaše fotky budou ${deletionDateLabel} smazány`
      : `Your photos will be deleted on ${deletionDateLabel}`;

  const text =
    locale === "cs"
      ? [
          `Dobrý den, ${name},`,
          "",
          reminder === 30
            ? `vaše galerie bude ${deletionDateLabel} smazána, zbývá tedy zhruba měsíc.`
            : `vaše galerie bude ${deletionDateLabel} smazána, zbývá tedy už jen týden.`,
          "Pokud jste si fotky ještě nestáhli, udělejte to prosím do té doby:",
          galleryLink,
          "",
          "Jan Hájek",
          "",
          `Nastavení e-mailů: ${preferencesLink}`,
        ].join("\n")
      : [
          `Hi ${name},`,
          "",
          reminder === 30
            ? `Your gallery will be deleted on ${deletionDateLabel}, about a month from now.`
            : `Your gallery will be deleted on ${deletionDateLabel}, just a week from now.`,
          "If you haven't downloaded your photos yet, please do so before then:",
          galleryLink,
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
