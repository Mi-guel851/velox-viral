import { NextResponse } from "next/server";
import {
  InstagramProvider,
  TwitterProvider,
  TikTokProvider,
  LinkedInProvider,
  FacebookProvider,
  ThreadsProvider,
  YouTubeProvider,
} from "@/lib/platforms";
import { Platform } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as Platform;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/${platform}/callback`;
  const state = Math.random().toString(36).substring(2, 15);

  let authUrl = "";

  switch (platform) {
    case "instagram":
      authUrl = InstagramProvider.getAuthorizationUrl({
        clientId: process.env.INSTAGRAM_CLIENT_ID || "demo_ig_client",
        redirectUri,
        state,
      });
      break;
    case "twitter":
      authUrl = TwitterProvider.getAuthorizationUrl({
        clientId: process.env.TWITTER_CLIENT_ID || "demo_twitter_client",
        redirectUri,
        state,
        codeChallenge: "demo_pkce_challenge_viralflow",
      });
      break;
    case "tiktok":
      authUrl = TikTokProvider.getAuthorizationUrl({
        clientKey: process.env.TIKTOK_CLIENT_KEY || "demo_tiktok_key",
        redirectUri,
        state,
      });
      break;
    case "linkedin":
      authUrl = LinkedInProvider.getAuthorizationUrl({
        clientId: process.env.LINKEDIN_CLIENT_ID || "demo_linkedin_client",
        redirectUri,
        state,
      });
      break;
    case "facebook":
      authUrl = FacebookProvider.getAuthorizationUrl({
        clientId: process.env.FACEBOOK_CLIENT_ID || "demo_fb_client",
        redirectUri,
        state,
      });
      break;
    case "threads":
      authUrl = ThreadsProvider.getAuthorizationUrl({
        clientId: process.env.THREADS_CLIENT_ID || "demo_threads_client",
        redirectUri,
        state,
      });
      break;
    case "youtube":
      authUrl = YouTubeProvider.getAuthorizationUrl({
        clientId: process.env.GOOGLE_CLIENT_ID || "demo_google_client",
        redirectUri,
        state,
      });
      break;
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  return NextResponse.json({
    platform,
    authUrl,
    state,
    scopes:
      platform === "instagram"
        ? InstagramProvider.REQUIRED_SCOPES
        : platform === "twitter"
        ? TwitterProvider.REQUIRED_SCOPES
        : platform === "tiktok"
        ? TikTokProvider.REQUIRED_SCOPES
        : platform === "linkedin"
        ? LinkedInProvider.REQUIRED_SCOPES
        : platform === "facebook"
        ? FacebookProvider.REQUIRED_SCOPES
        : platform === "threads"
        ? ThreadsProvider.REQUIRED_SCOPES
        : YouTubeProvider.REQUIRED_SCOPES,
  });
}
