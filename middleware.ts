import { NextRequest, NextFetchEvent } from "next/server";
import createMiddleware from "next-intl/middleware";
import type { NextAuthRequest } from "next-auth";
import { routing } from "./app/i18n/routing";
import { auth } from "@/auth";
import { PROOF_PATH_SEGMENTS } from "@/app/lib/proof-link";

const intlMiddleware = createMiddleware(routing);

// "/(proof|photos|fotky)/[^/]+" is a regex fragment, not a literal path —
// it matches any single path segment (the gallery token) after one of the
// proof link segments, since that route has no session (see
// docs/photo-proofing-design.md §6, §7a, and app/lib/proof-link.ts).
const publicPages = [
  "/",
  "/admin/login",
  "/privacy",
  "/email-preferences",
  `/(${PROOF_PATH_SEGMENTS.join("|")})/[^/]+`,
];

const authMiddleware = auth((req: NextAuthRequest, _event: NextFetchEvent) => {
  return intlMiddleware(req);
});

export default function middleware(req: NextRequest, ctx: NextFetchEvent) {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join("|")}))?(${publicPages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")})/?$`,
    "i"
  );

  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(req);
  }

  return authMiddleware(req, ctx);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};