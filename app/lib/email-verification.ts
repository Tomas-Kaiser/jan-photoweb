import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

// Email verification by magic link or 6-digit code — either one proves the
// person controls the address. Pure decisions over a stored record: the
// caller loads the record, calls in here, and writes back what it returns.
// Only hashes of the secrets are ever stored.

export type VerificationRecord = {
  codeHash: string;
  linkTokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
  sendCount: number;
  lastSentAt: Date;
};

export type VerificationSecrets = { code: string; linkToken: string };

export type RequestOutcome =
  // Email these secrets and store the record — over the pending one when
  // `replacesPending`, otherwise as a new verification.
  | {
      kind: "send";
      replacesPending: boolean;
      secrets: VerificationSecrets;
      record: VerificationRecord;
    }
  // A code was already sent and still works; ask for it.
  | { kind: "pending" }
  // null when there's no single moment it frees up.
  | { kind: "rateLimited"; retryAfterSeconds: number | null };

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; reason: "wrong"; attemptsLeft: number }
  | { ok: false; reason: "expired" | "used" | "tooManyAttempts" };

const VERIFICATION_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS = 5;
const MAX_STARTS_PER_GALLERY_PER_HOUR = 10;

// The form of an address used as a client's identity: one person, one
// client. Null when it isn't plausibly an email address.
export function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

export function hashVerificationSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function hashesMatch(a: string, b: string) {
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function issueSecrets(now: Date, sendCount: number) {
  const secrets = {
    code: String(randomInt(0, 1_000_000)).padStart(6, "0"),
    linkToken: randomBytes(32).toString("base64url"),
  };
  const record: VerificationRecord = {
    codeHash: hashVerificationSecret(secrets.code),
    linkTokenHash: hashVerificationSecret(secrets.linkToken),
    expiresAt: new Date(now.getTime() + VERIFICATION_TTL_MS),
    consumedAt: null,
    attempts: 0,
    sendCount,
    lastSentAt: now,
  };
  return { secrets, record };
}

function isUsable(record: VerificationRecord, now: Date) {
  return (
    !record.consumedAt &&
    now < record.expiresAt &&
    record.attempts < MAX_ATTEMPTS
  );
}

// Decides what a registration form submission (or its Resend button) does.
// `pending` is the latest verification for this gallery and email, and
// `startsInLastHour` counts the verifications the gallery started in the
// last hour, across all emails, so the form can't be used to spam inboxes.
// A plain resubmission keeps a usable pending verification rather than
// emailing again; only an explicit resend replaces its code and link.
export function requestVerification(
  {
    pending,
    startsInLastHour,
    resend,
  }: {
    pending: VerificationRecord | null;
    startsInLastHour: number;
    resend: boolean;
  },
  now: Date,
): RequestOutcome {
  if (pending && isUsable(pending, now)) {
    if (!resend) return { kind: "pending" };

    const msSinceSent = now.getTime() - pending.lastSentAt.getTime();
    if (msSinceSent < RESEND_COOLDOWN_MS) {
      return {
        kind: "rateLimited",
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - msSinceSent) / 1000),
      };
    }
    if (pending.sendCount >= MAX_SENDS) {
      return {
        kind: "rateLimited",
        retryAfterSeconds: Math.ceil(
          (pending.expiresAt.getTime() - now.getTime()) / 1000,
        ),
      };
    }

    return {
      kind: "send",
      replacesPending: true,
      ...issueSecrets(now, pending.sendCount + 1),
    };
  }

  if (startsInLastHour >= MAX_STARTS_PER_GALLERY_PER_HOUR) {
    return { kind: "rateLimited", retryAfterSeconds: null };
  }

  return { kind: "send", replacesPending: false, ...issueSecrets(now, 1) };
}

// The link and the code share one attempt budget: a wrong guess at either
// counts. On `wrong`, the caller increments `attempts`; on `ok`, it sets
// `consumedAt` (under a row lock, so two concurrent tries can't both win).
function verify(
  record: VerificationRecord,
  secret: string,
  storedHash: string,
  now: Date,
): VerifyOutcome {
  if (record.consumedAt) return { ok: false, reason: "used" };
  if (now >= record.expiresAt) return { ok: false, reason: "expired" };
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "tooManyAttempts" };
  }
  if (secret && hashesMatch(storedHash, hashVerificationSecret(secret))) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: "wrong",
    attemptsLeft: MAX_ATTEMPTS - record.attempts - 1,
  };
}

export function verifyCode(
  record: VerificationRecord,
  code: string,
  now: Date,
): VerifyOutcome {
  const digits = code.replace(/\s/g, "");
  return verify(
    record,
    /^\d{6}$/.test(digits) ? digits : "",
    record.codeHash,
    now,
  );
}

export function verifyLinkToken(
  record: VerificationRecord,
  linkToken: string,
  now: Date,
): VerifyOutcome {
  return verify(record, linkToken, record.linkTokenHash, now);
}
