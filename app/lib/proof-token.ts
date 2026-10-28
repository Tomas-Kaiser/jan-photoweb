import { randomInt } from "crypto";

const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 10;
const MAX_SLUG_LENGTH = 50;

// "Nováková – Svatba 2026" → "novakova-svatba-2026"
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
}

// Readable client-name slug + a CSPRNG suffix, e.g.
// "novakova-svatba-2026-k3x9q2m7a1". The slug is only cosmetic — the
// suffix alone (36^10 ≈ 3.6e15) keeps the link unguessable per the
// proof-gallery link security model (docs/photo-proofing-design.md §7a).
export function generateProofToken(clientName: string) {
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += SUFFIX_ALPHABET[randomInt(SUFFIX_ALPHABET.length)];
  }

  const slug = slugify(clientName);
  return slug ? `${slug}-${suffix}` : suffix;
}
