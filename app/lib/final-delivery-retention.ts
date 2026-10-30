export const FINAL_DELIVERY_RETENTION_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When a gallery is auto-deleted, counting from when its final photos were
 * published to the client. Keep in sync with the cron schedule in
 * app/api/cron/delete-expired-final-deliveries/route.ts.
 */
export function getFinalDeliveryDeletionDate(finalsPublishedAt: Date): Date {
  return new Date(
    finalsPublishedAt.getTime() + FINAL_DELIVERY_RETENTION_DAYS * DAY_MS,
  );
}

/** Days left before a gallery's final photos are auto-deleted. */
export function getDaysUntilFinalDeliveryDeletion(finalsPublishedAt: Date): number {
  const deletionTime = getFinalDeliveryDeletionDate(finalsPublishedAt).getTime();
  return Math.max(0, Math.ceil((deletionTime - Date.now()) / DAY_MS));
}

/**
 * Galleries whose finals were published at or before this moment are past
 * retention and due for deletion by the cron.
 */
export function getFinalDeliveryExpiryCutoff(): Date {
  return new Date(Date.now() - FINAL_DELIVERY_RETENTION_DAYS * DAY_MS);
}
