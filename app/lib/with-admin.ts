import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Middleware's matcher excludes /api, so every admin route handler must be
// wrapped in this to be protected at all.
export function withAdmin<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    const session = await auth();

    const isAdmin =
      !!session?.user && (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(...args);
  };
}
