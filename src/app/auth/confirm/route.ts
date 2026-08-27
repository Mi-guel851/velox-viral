import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Email link handler for signup confirmation and password recovery.
 *
 * Supabase emails point here with `token_hash` + `type`. Exchanging that hash
 * for a session server-side means the token never sits in a client-side URL that
 * could leak via `Referer` or browser history sync — we consume it and
 * immediately redirect to a clean path.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");

  // Only relative paths, so a crafted email link cannot bounce the user to an
  // attacker-controlled host carrying a valid session.
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Authentication is not configured on this deployment.")}`
    );
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("That confirmation link is malformed. Request a new one.")}`
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("[auth/confirm] verifyOtp failed:", error.message);

    const message =
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("invalid")
        ? "That link has expired or was already used. Please request a new one."
        : "We couldn't verify that link. Please request a new one.";

    // Recovery failures belong on the forgot-password screen, where the user can
    // immediately request a fresh link.
    const destination = type === "recovery" ? "/forgot-password" : "/login";
    return NextResponse.redirect(`${origin}${destination}?error=${encodeURIComponent(message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
