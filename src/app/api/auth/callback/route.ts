import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getAdapter } from "@/lib/platforms/adapters";
import type { Platform } from "@/lib/types";

/**
 * OAuth callback handler for social media platforms.
 *
 * After the user authorizes on the platform (e.g. Twitter, Instagram),
 * the platform redirects here with ?code= and ?state= parameters.
 * We exchange the code for tokens, fetch the user's identity, and store
 * everything in the database.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Platform is extracted from the URL path: /api/auth/callback?platform=twitter
  // But since this is a catch-all callback, we need the platform from state or query
  const platform = searchParams.get("platform") as Platform | null;

  // Handle provider errors
  if (error) {
    const message = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/dashboard?tab=accounts&error=${encodeURIComponent(message)}`
    );
  }

  if (!code || !platform) {
    return NextResponse.redirect(
      `${origin}/dashboard?tab=accounts&error=${encodeURIComponent("Missing authorization code or platform.")}`
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/dashboard?tab=accounts&error=${encodeURIComponent("Database not configured.")}`
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?next=${encodeURIComponent("/dashboard?tab=accounts")}`
    );
  }

  try {
    const adapter = getAdapter(platform);
    if (!adapter) {
      return NextResponse.redirect(
        `${origin}/dashboard?tab=accounts&error=${encodeURIComponent(`${platform} is not configured on this deployment.`)}`
      );
    }

    // Build the redirect URI to match what was used in the authorization request
    const redirectUri = `${origin}/api/auth/callback`;

    // Exchange the authorization code for tokens
    const tokenSet = await adapter.exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier: undefined, // TODO: retrieve from oauth_states table using state param
    });

    // Fetch the user's identity on the platform
    const identity = await adapter.fetchAccountIdentity(tokenSet.accessToken);

    const supabase = await createServerSupabaseClient();

    // Check if this account is already connected
    const { data: existingAccount } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .eq("platform_user_id", identity.platformUserId)
      .maybeSingle();

    if (existingAccount) {
      // Update the existing account
      await supabase
        .from("social_accounts")
        .update({
          username: identity.username,
          display_name: identity.displayName,
          avatar_url: identity.avatarUrl,
          follower_count: identity.followerCount || 0,
          platform_metadata: identity.metadata || {},
          status: "connected",
          token_expires_at: tokenSet.expiresAt,
          last_synced_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", existingAccount.id);

      // Update the token
      if (tokenSet.accessToken) {
        // Encrypt the token before storing
        const { isEncryptionConfigured, getEncryptionKey } = await import("@/lib/env.server");
        if (isEncryptionConfigured()) {
          const { createCipheriv, randomBytes } = await import("node:crypto");
          const key = getEncryptionKey()!;
          const iv = randomBytes(16);
          const cipher = createCipheriv("aes-256-cbc", key, iv);
          const encrypted = Buffer.concat([
            cipher.update(tokenSet.accessToken, "utf8"),
            cipher.final(),
          ]);
          const storedToken = Buffer.concat([iv, encrypted]).toString("hex");

          await supabase.from("social_account_secrets").upsert(
            {
              social_account_id: existingAccount.id,
              access_token_enc: storedToken,
              refresh_token_enc: tokenSet.refreshToken || null,
              token_expires_at: tokenSet.expiresAt,
              refresh_expires_at: tokenSet.refreshExpiresAt,
              last_refreshed_at: new Date().toISOString(),
            },
            { onConflict: "social_account_id" }
          );
        }
      }
    } else {
      // Insert a new connected account
      const { data: newAccount } = await supabase
        .from("social_accounts")
        .insert({
          user_id: user.id,
          platform,
          platform_user_id: identity.platformUserId,
          username: identity.username,
          display_name: identity.displayName,
          avatar_url: identity.avatarUrl,
          follower_count: identity.followerCount || 0,
          platform_metadata: identity.metadata || {},
          scopes: tokenSet.scopes || [],
          status: "connected",
          token_expires_at: tokenSet.expiresAt,
          last_synced_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();

      // Store the encrypted token
      if (newAccount && tokenSet.accessToken) {
        const { isEncryptionConfigured, getEncryptionKey } = await import("@/lib/env.server");
        if (isEncryptionConfigured()) {
          const { createCipheriv, randomBytes } = await import("node:crypto");
          const key = getEncryptionKey()!;
          const iv = randomBytes(16);
          const cipher = createCipheriv("aes-256-cbc", key, iv);
          const encrypted = Buffer.concat([
            cipher.update(tokenSet.accessToken, "utf8"),
            cipher.final(),
          ]);
          const storedToken = Buffer.concat([iv, encrypted]).toString("hex");

          await supabase.from("social_account_secrets").insert({
            social_account_id: newAccount.id,
            access_token_enc: storedToken,
            refresh_token_enc: tokenSet.refreshToken || null,
            token_expires_at: tokenSet.expiresAt,
            refresh_expires_at: tokenSet.refreshExpiresAt,
            last_refreshed_at: new Date().toISOString(),
          });
        }
      }
    }

    // Log the connection
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "account_connected",
      entity_type: "social_account",
      entity_id: platform,
      metadata: {
        platform,
        username: identity.username,
        display_name: identity.displayName,
      },
    });

    return NextResponse.redirect(
      `${origin}/dashboard?tab=accounts&connected=${encodeURIComponent(platform)}`
    );
  } catch (err: any) {
    console.error(`[auth/callback] ${platform} OAuth error:`, err);
    return NextResponse.redirect(
      `${origin}/dashboard?tab=accounts&error=${encodeURIComponent(
        err.message || `Failed to connect ${platform}. Please try again.`
      )}`
    );
  }
}
