// Localized path segment for client-facing proof links. Rewritten onto
// /[locale]/proof/[token] by next.config.ts (via getProofLinkRewrites); the
// legacy "proof" segment still works for links sent before this existed.
export const PROOF_LINK_SEGMENTS = {
  en: "photos",
  cs: "fotky",
} as const;

export type ProofLinkLocale = keyof typeof PROOF_LINK_SEGMENTS;

export const PROOF_PATH_SEGMENTS = [
  "proof",
  ...Object.values(PROOF_LINK_SEGMENTS),
];

export function getProofLinkPath(locale: ProofLinkLocale, token: string) {
  return `/${locale}/${PROOF_LINK_SEGMENTS[locale]}/${token}`;
}

// One rewrite per locale, so each locale only accepts its own segment
// (/en/photos/…, /cs/fotky/…) and not a mismatched pair like /en/fotky/….
export function getProofLinkRewrites() {
  return (Object.keys(PROOF_LINK_SEGMENTS) as ProofLinkLocale[]).map(
    (locale) => ({
      source: getProofLinkPath(locale, ":token"),
      destination: `/${locale}/proof/:token`,
    }),
  );
}

// Locale-less pathname (as next-intl's usePathname returns it).
export function isProofPathname(pathname: string) {
  return PROOF_PATH_SEGMENTS.some((segment) =>
    pathname.startsWith(`/${segment}/`),
  );
}
