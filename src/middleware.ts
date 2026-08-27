import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase session and enforces route protection on every
 * navigation. See `src/lib/supabase/middleware.ts` for the reasoning.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. Auth cookies must be
     * refreshed on page navigations, but running this on every `_next/static`
     * request would be pure overhead.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)$).*)",
  ],
};
