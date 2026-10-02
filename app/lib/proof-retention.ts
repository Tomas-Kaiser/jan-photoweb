export const PROOF_RETENTION_DAYS = 15;

/**
 * Days left before a paid proof gallery is auto-deleted, counting from
 * when the order was confirmed. Keep in sync with the cron schedule in
 * app/api/cron/delete-expired-proofs/route.ts.
 */
export function getDaysUntilProofDeletion(confirmedAt: Date): number {
  const deletionTime =
    confirmedAt.getTime() + PROOF_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deletionTime - Date.now()) / (24 * 60 * 60 * 1000)));
}
