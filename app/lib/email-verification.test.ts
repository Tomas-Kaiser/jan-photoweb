import { describe, expect, it } from "vitest";
import {
  normaliseEmail,
  requestVerification,
  verifyCode,
  verifyLinkToken,
} from "./email-verification";

const now = new Date("2026-10-30T10:00:00Z");

function minutesLater(minutes: number) {
  return new Date(now.getTime() + minutes * 60_000);
}

function issue() {
  const outcome = requestVerification(
    { pending: null, startsInLastHour: 0, resend: false },
    now,
  );
  if (outcome.kind !== "send") throw new Error("expected a send");
  return outcome;
}

describe("verifying a freshly sent verification", () => {
  it("accepts the emailed code and the emailed link", () => {
    const { secrets, record } = issue();

    expect(secrets.code).toMatch(/^\d{6}$/);
    expect(verifyCode(record, secrets.code, minutesLater(1))).toEqual({
      ok: true,
    });
    expect(verifyLinkToken(record, secrets.linkToken, minutesLater(1))).toEqual(
      { ok: true },
    );
  });

  it("accepts the code with surrounding or inner spaces", () => {
    const { secrets, record } = issue();
    const spaced = ` ${secrets.code.slice(0, 3)} ${secrets.code.slice(3)} `;

    expect(verifyCode(record, spaced, minutesLater(1))).toEqual({ ok: true });
  });
});

describe("rejecting a wrong code", () => {
  it("reports how many attempts are left, then locks after five wrong codes", () => {
    const { secrets, record } = issue();
    const wrong = secrets.code === "000000" ? "111111" : "000000";

    expect(verifyCode(record, wrong, minutesLater(1))).toEqual({
      ok: false,
      reason: "wrong",
      attemptsLeft: 4,
    });
    expect(
      verifyCode({ ...record, attempts: 4 }, wrong, minutesLater(1)),
    ).toEqual({ ok: false, reason: "wrong", attemptsLeft: 0 });
    // Even the right code is refused once the attempts are used up.
    expect(
      verifyCode({ ...record, attempts: 5 }, secrets.code, minutesLater(1)),
    ).toEqual({ ok: false, reason: "tooManyAttempts" });
  });

  it("rejects a wrong link token", () => {
    const { record } = issue();

    expect(verifyLinkToken(record, "not-the-token", minutesLater(1))).toEqual(
      { ok: false, reason: "wrong", attemptsLeft: 4 },
    );
  });

  it("rejects something that isn't a 6-digit code", () => {
    const { record } = issue();

    expect(verifyCode(record, "abc", minutesLater(1))).toMatchObject({
      ok: false,
      reason: "wrong",
    });
  });
});

describe("requesting a verification", () => {
  it("sends a fresh one when nothing is pending", () => {
    const outcome = requestVerification(
      { pending: null, startsInLastHour: 3, resend: false },
      now,
    );

    expect(outcome).toMatchObject({
      kind: "send",
      replacesPending: false,
      record: { sendCount: 1, attempts: 0, expiresAt: minutesLater(15) },
    });
  });

  it("keeps a pending one instead of emailing again when the form is resubmitted", () => {
    const { record } = issue();

    expect(
      requestVerification(
        { pending: record, startsInLastHour: 1, resend: false },
        minutesLater(5),
      ),
    ).toEqual({ kind: "pending" });
  });

  it("starts over when the pending one expired, was used or is locked", () => {
    const { record } = issue();

    for (const [pending, at] of [
      [record, minutesLater(15)],
      [{ ...record, consumedAt: minutesLater(1) }, minutesLater(2)],
      [{ ...record, attempts: 5 }, minutesLater(2)],
    ] as const) {
      expect(
        requestVerification(
          { pending, startsInLastHour: 1, resend: false },
          at,
        ),
      ).toMatchObject({ kind: "send", replacesPending: false });
    }
  });

  it("limits how many verifications a gallery can start per hour", () => {
    expect(
      requestVerification(
        { pending: null, startsInLastHour: 10, resend: false },
        now,
      ),
    ).toEqual({ kind: "rateLimited", retryAfterSeconds: null });
  });
});

describe("resending", () => {
  it("waits a minute between sends", () => {
    const { record } = issue();

    expect(
      requestVerification(
        { pending: record, startsInLastHour: 1, resend: true },
        new Date(now.getTime() + 20_000),
      ),
    ).toEqual({ kind: "rateLimited", retryAfterSeconds: 40 });
  });

  it("replaces the code and link, invalidating the old ones and resetting attempts", () => {
    const first = issue();
    const outcome = requestVerification(
      {
        pending: { ...first.record, attempts: 3 },
        startsInLastHour: 1,
        resend: true,
      },
      minutesLater(2),
    );
    if (outcome.kind !== "send") throw new Error("expected a send");

    expect(outcome).toMatchObject({
      replacesPending: true,
      record: { sendCount: 2, attempts: 0, expiresAt: minutesLater(17) },
    });
    expect(
      verifyCode(outcome.record, outcome.secrets.code, minutesLater(3)),
    ).toEqual({ ok: true });
    if (first.secrets.code !== outcome.secrets.code) {
      expect(
        verifyCode(outcome.record, first.secrets.code, minutesLater(3)),
      ).toMatchObject({ ok: false, reason: "wrong" });
    }
    expect(
      verifyLinkToken(outcome.record, first.secrets.linkToken, minutesLater(3)),
    ).toMatchObject({ ok: false, reason: "wrong" });
  });

  it("stops resending after five sends until the pending one expires", () => {
    const { record } = issue();

    expect(
      requestVerification(
        { pending: { ...record, sendCount: 5 }, startsInLastHour: 1, resend: true },
        minutesLater(10),
      ),
    ).toEqual({ kind: "rateLimited", retryAfterSeconds: 300 });
  });
});

describe("expiry and single use", () => {
  it("rejects the code and the link after 15 minutes", () => {
    const { secrets, record } = issue();

    expect(verifyCode(record, secrets.code, minutesLater(14))).toEqual({
      ok: true,
    });
    expect(verifyCode(record, secrets.code, minutesLater(15))).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(
      verifyLinkToken(record, secrets.linkToken, minutesLater(16)),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a code or link that was already used", () => {
    const { secrets, record } = issue();
    const used = { ...record, consumedAt: minutesLater(1) };

    expect(verifyCode(used, secrets.code, minutesLater(2))).toEqual({
      ok: false,
      reason: "used",
    });
    expect(verifyLinkToken(used, secrets.linkToken, minutesLater(2))).toEqual(
      { ok: false, reason: "used" },
    );
  });
});

describe("normaliseEmail", () => {
  it("trims and lower-cases, so one person maps to one client", () => {
    expect(normaliseEmail("  Jana.Novakova@Example.CZ ")).toBe(
      "jana.novakova@example.cz",
    );
  });

  it("rejects things that aren't an email address", () => {
    for (const value of ["", "jana", "jana@", "@example.cz", "a b@c.cz", 42]) {
      expect(normaliseEmail(value)).toBeNull();
    }
    expect(normaliseEmail(`${"a".repeat(250)}@example.cz`)).toBeNull();
  });
});
