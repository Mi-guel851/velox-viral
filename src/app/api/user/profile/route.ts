import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        authenticated: false,
        profile: null,
        message: "Database not configured",
      });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        profile: null,
      });
    }

    // Fetch the profile from the profiles table
    const { createServerSupabaseClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createServerSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, username, avatar_url, timezone")
      .eq("id", user.id)
      .maybeSingle();

    // Also fetch connected social accounts count
    const { count: connectedCount } = await supabase
      .from("social_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "connected");

    return NextResponse.json({
      authenticated: true,
      profile: profile || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        username: null,
        avatar_url: null,
      },
      connectedAccounts: connectedCount || 0,
    });
  } catch (error: any) {
    console.error("[/api/user/profile]", error);
    return NextResponse.json(
      { authenticated: false, profile: null, error: error.message },
      { status: 500 }
    );
  }
}
