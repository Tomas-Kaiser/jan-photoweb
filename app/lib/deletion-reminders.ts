import { getFinalDeliveryDeletionDate } from "@/app/lib/final-delivery-retention";

// Which deletion reminder a claimed gallery's owner is due, 30 or 7 days
// before its deletion date. The daily cron records each send on the
// gallery, so a reminder goes out once, and still goes out on a later run
// if the cron missed its day. A missed 30-day reminder is dropped once the
// 7-day one is due, so the owner never gets both at once, and nothing goes
// out once the deletion date has passed. Pure: the sending is in
// app/lib/send-deletion-reminders.ts.

export type DeletionReminder = 30 | 7;

export type DeletionReminderState = {
  finalsPublishedAt: Date;
  reminder30SentAt: Date | null;
  reminder7SentAt: Date | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDueDeletionReminder(
  gallery: DeletionReminderState,
  now: Date,
): DeletionReminder | null {
  const deletionTime = getFinalDeliveryDeletionDate(
    gallery.finalsPublishedAt,
  ).getTime();

  if (now.getTime() >= deletionTime) return null;
  if (now.getTime() >= deletionTime - 7 * DAY_MS) {
    return gallery.reminder7SentAt ? null : 7;
  }
  if (now.getTime() >= deletionTime - 30 * DAY_MS) {
    return gallery.reminder30SentAt ? null : 30;
  }
  return null;
}
