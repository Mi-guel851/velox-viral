import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * PKCE code exchange endpoint.
 *
 * Supabase Auth redirects here with `?code=` after an email link or a social
 * sign-in provider. We swap the code for a session cookie server-side, then
 * redirect onward.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const errorDescription = searchParams.get("error_description");

  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  // The provider itself rejected the request (user cancelled, scope denied...).
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Authentication is not configured on this deployment.")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing authorization code.")}`
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("We couldn't complete sign-in. Please try again.")}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
