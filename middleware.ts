import { NextRequest, NextFetchEvent } from "next/server";
import createMiddleware from "next-intl/middleware";
import type { NextAuthRequest } from "next-auth";
import { routing } from "./app/i18n/routing";
import { auth } from "@/auth";

const intlMiddleware = createMiddleware(routing);

const publicPages = ["/", "/admin/login"];

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