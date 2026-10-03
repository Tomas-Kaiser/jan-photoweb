export const FINAL_DELIVERY_RETENTION_DAYS = 180;

/**
 * Days left before a gallery's final photos are auto-deleted, counting from
 * when they were published to the client. Keep in sync with the cron
 * schedule in app/api/cron/delete-expired-final-deliveries/route.ts.
 */
export function getDaysUntilFinalDeliveryDeletion(finalsPublishedAt: Date): number {
  const deletionTime =
    finalsPublishedAt.getTime() +
    FINAL_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deletionTime - Date.now()) / (24 * 60 * 60 * 1000)));
}
