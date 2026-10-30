import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

// Email verification by magic link or 6-digit code — either one proves the
// person controls the address. Pure decisions over a stored record: the
// caller loads the record, calls in here, and writes back what it returns.
// Only hashes of the code and link are ever stored, keyed with a server
// secret: a 6-digit code has only a million values, so a plain hash would
// be reversible by anyone who could read the database.

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
  | { kind: "rateLimited"; retryAfterSeconds: number };

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; reason: "wrong"; attemptsLeft: number }
  | { ok: false; reason: "expired" | "used" | "tooManyAttempts" };

const VERIFICATION_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS = 5;

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

function hashesMatch(a: string, b: string) {
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Binds the rules to the server secret that keys the stored hashes
// (EMAIL_VERIFICATION_SECRET in the app). Changing the secret invalidates
// verifications in flight, nothing else.
export function createEmailVerification(serverSecret: string) {
  if (!serverSecret) {
    throw new Error("Email verification needs a server secret.");
  }

  function hash(value: string) {
    return createHmac("sha256", serverSecret).update(value).digest("hex");
  }

  function issueSecrets(now: Date, sendCount: number) {
    const secrets = {
      code: String(randomInt(0, 1_000_000)).padStart(6, "0"),
      linkToken: randomBytes(32).toString("base64url"),
    };
    const record: VerificationRecord = {
      codeHash: hash(secrets.code),
      linkTokenHash: hash(secrets.linkToken),
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
  // `pending` is the latest verification for this gallery and email. A plain
  // resubmission keeps a usable pending verification rather than emailing
  // again; only an explicit resend replaces its code and link. Limits are
  // per gallery and email only: a gallery-wide limit would let anyone with
  // the link lock the real owner out.
  function requestVerification(
    {
      pending,
      resend,
    }: {
      pending: VerificationRecord | null;
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

    return { kind: "send", replacesPending: false, ...issueSecrets(now, 1) };
  }

  // The link and the code share one attempt budget: a wrong guess at either
  // counts. On `wrong`, the caller increments `attempts`; on `ok`, it sets
  // `consumedAt` (under a row lock, so two concurrent tries can't both win).
  function verify(
    record: VerificationRecord,
    submitted: string,
    storedHash: string,
    now: Date,
  ): VerifyOutcome {
    if (record.consumedAt) return { ok: false, reason: "used" };
    if (now >= record.expiresAt) return { ok: false, reason: "expired" };
    if (record.attempts >= MAX_ATTEMPTS) {
      return { ok: false, reason: "tooManyAttempts" };
    }
    if (submitted && hashesMatch(storedHash, hash(submitted))) {
      return { ok: true };
    }
    return {
      ok: false,
      reason: "wrong",
      attemptsLeft: MAX_ATTEMPTS - record.attempts - 1,
    };
  }

  function verifyCode(
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

  function verifyLinkToken(
    record: VerificationRecord,
    linkToken: string,
    now: Date,
  ): VerifyOutcome {
    return verify(record, linkToken, record.linkTokenHash, now);
  }

  return { requestVerification, verifyCode, verifyLinkToken };
}
