import { randomBytes } from "crypto";

// CSPRNG, URL-safe, 16 chars — unguessable per the proof-gallery link
// security model (docs/photo-proofing-design.md §7a).
export function generateProofToken() {
  return randomBytes(12).toString("base64url");
}
