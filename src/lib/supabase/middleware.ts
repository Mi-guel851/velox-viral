/**
 * Middleware Supabase client + session refresh.
 *
 * Supabase access tokens are short-lived. Server components cannot write
 * cookies during render, so if nothing refreshed the token the user would be
 * silently signed out mid-session. Middleware runs before every matched request
 * and is the one place that can both read and write cookies, which makes it the
 * correct home for refresh and for route protection.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

/** Auth routes a signed-in user should be bounced away from. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // With no Supabase configured there is no session to refresh and nothing to
  // protect — the app renders its setup screen instead.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the request (so this render sees the fresh token) and to
          // the response (so the browser stores it).
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() verifies the JWT against the auth server. Do not swap this for
  // getSession(), which only decodes a cookie and can be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Unauthenticated visitor hitting the app: send to login, remembering where
  // they were headed so we can return them after signing in.
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in user hitting login/signup: send them into the app. `next` is
  // constrained to a relative path so it cannot be used as an open redirect.
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const requested = searchParams.get("next");
    url.pathname = requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
