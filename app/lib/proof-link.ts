// Localized path segment for client-facing proof links. Rewritten onto
// /[locale]/proof/[token] in next.config.ts; the legacy "proof" segment
// still works for links sent before this existed.
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

// Locale-less pathname (as next-intl's usePathname returns it).
export function isProofPathname(pathname: string) {
  return PROOF_PATH_SEGMENTS.some((segment) =>
    pathname.startsWith(`/${segment}/`),
  );
}
