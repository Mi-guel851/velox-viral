import { NextResponse } from "next/server";
import { getAdapter, isSupportedPlatform, getPlatformAvailability } from "@/lib/platforms/adapters";
import type { Platform } from "@/lib/types";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Initiates the OAuth flow for a social platform.
 *
 * Returns the authorization URL that the client should open in a popup.
 * If the platform is not configured (missing env vars), returns an error
 * explaining what credentials are needed.
 */
export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as Platform;
  const url = new URL(request.url);

  if (!isSupportedPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  // Check if this platform is configured
  const availability = getPlatformAvailability(platform);
  if (!availability.configured) {
    return NextResponse.json(
      {
        error: `${platform} is not configured on this deployment.`,
        envKeys: availability.envKeys,
        message: `Add ${availability.envKeys.join(" and ")} to your environment variables to enable ${platform} connections.`,
      },
      { status: 400 }
    );
  }

  // Check if user is authenticated
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to connect a social account." },
        { status: 401 }
      );
    }
  }

  const adapter = getAdapter(platform);
  if (!adapter) {
    return NextResponse.json(
      { error: `Could not initialize ${platform} adapter.` },
      { status: 500 }
    );
  }

  // Build the redirect URI — the callback handler at /api/auth/callback
  const redirectUri = `${url.origin}/api/auth/callback`;
  const state = `${platform}_${Math.random().toString(36).substring(2, 15)}`;

  const authResult = adapter.buildAuthorizationUrl({
    clientId: availability.envKeys[0] ? (process.env[availability.envKeys[0]] || "") : "",
    redirectUri,
    state,
  });

  return NextResponse.json({
    platform,
    authUrl: authResult.url,
    codeVerifier: authResult.codeVerifier,
    state,
    scopes: [...adapter.requiredScopes],
    capabilities: availability.capabilities,
  });
}
