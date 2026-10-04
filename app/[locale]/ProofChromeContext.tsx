"use client";

import { createContext, useContext, useEffect } from "react";

type SetHideProofChrome = (hidden: boolean) => void;

export const ProofChromeContext = createContext<SetHideProofChrome | null>(null);

// Lets a proof-page view (e.g. a full-bleed hero layout) hide SiteChrome's
// minimal ProofHeader/ProofFooter while it's mounted — automatically
// restored on unmount. Finals/selection/thank-you all share the same
// /proof/[token] URL, so this can't be done by pathname alone.
export function useHideProofChrome(hidden: boolean) {
  const setHidden = useContext(ProofChromeContext);

  useEffect(() => {
    if (!setHidden) return;
    setHidden(hidden);
    return () => setHidden(false);
  }, [hidden, setHidden]);
}
