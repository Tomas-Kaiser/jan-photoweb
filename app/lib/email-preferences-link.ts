import { createHmac, timingSafeEqual } from "crypto";

// The signed "Manage email preferences" link in every email the app sends
// a client. The token is the address itself plus an HMAC of it, so the link
// needs no stored state and works before a client record exists — a
// verification email goes out before the person has verified. Whoever holds
// the link can only change news & offers for that one address, and they
// were sent it at that address. It doesn't expire: deletion reminders go
// out up to a year after the person registered.

// Binds signing to the server secret (EMAIL_PREFERENCES_SECRET in the app).
// Changing the secret breaks every link already emailed.
export function createEmailPreferencesLink(serverSecret: string) {
  if (!serverSecret) {
    throw new Error("Email preferences links need a server secret.");
  }

  function signature(email: string) {
    return createHmac("sha256", serverSecret).update(email).digest("base64url");
  }

  // `email` already normalised, as stored on the client.
  function sign(email: string) {
    return `${Buffer.from(email).toString("base64url")}.${signature(email)}`;
  }

  // The email a token was signed for, or null for anything else — including
  // whatever arrives in the query string when the link has been mangled.
  function verify(token: unknown): string | null {
    if (typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encodedEmail, submitted] = parts;
    const email = Buffer.from(encodedEmail, "base64url").toString();
    const expected = Buffer.from(signature(email));
    const actual = Buffer.from(submitted);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return null;
    }
    return email;
  }

  return { sign, verify };
}
