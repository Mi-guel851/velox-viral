import { NextResponse } from "next/server";
import { getCurrentUser, createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getAdapter } from "@/lib/platforms/adapters";
import type { Platform } from "@/lib/types";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Connect Supabase to enable publishing." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to publish." },
        { status: 401 }
      );
    }

    const { content, platformContent, targetPlatforms, mediaUrls, title, firstComment } =
      await request.json();

    if (!targetPlatforms?.length) {
      return NextResponse.json(
        { success: false, error: "Select at least one platform to publish to." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const results: Record<string, { success: boolean; remotePostId?: string; remoteUrl?: string; error?: string }> = {};

    for (const platform of targetPlatforms as Platform[]) {
      try {
        // Get the adapter for this platform
        const adapter = getAdapter(platform);
        if (!adapter) {
          results[platform] = {
            success: false,
            error: `${platform} is not configured on this deployment. Add the platform's OAuth credentials to your environment variables.`,
          };
          continue;
        }

        // Fetch the user's connected account and decrypted tokens for this platform
        const { data: account } = await supabase
          .from("social_accounts")
          .select("id, platform_user_id, username, display_name, avatar_url, platform_metadata")
          .eq("user_id", user.id)
          .eq("platform", platform)
          .eq("status", "connected")
          .maybeSingle();

        if (!account) {
          results[platform] = {
            success: false,
            error: `No connected ${platform} account found. Connect your ${platform} account first.`,
          };
          continue;
        }

        // Fetch the encrypted token
        const { data: secret } = await supabase
          .from("social_account_secrets")
          .select("access_token_enc, refresh_token_enc, token_expires_at")
          .eq("social_account_id", account.id)
          .maybeSingle();

        if (!secret?.access_token_enc) {
          results[platform] = {
            success: false,
            error: `No access token found for ${platform}. Please reconnect the account.`,
          };
          continue;
        }

        // Decrypt the token (requires TOKEN_ENCRYPTION_KEY)
        let accessToken: string;
        try {
          const { isEncryptionConfigured, getEncryptionKey } = await import("@/lib/env.server");
          const { createDecipheriv } = await import("node:crypto");

          if (!isEncryptionConfigured()) {
            results[platform] = {
              success: false,
              error: "Token encryption is not configured. Add TOKEN_ENCRYPTION_KEY to your environment.",
            };
            continue;
          }

          const key = getEncryptionKey()!;
          const encryptedBuf = Buffer.from(secret.access_token_enc, "hex");
          const iv = encryptedBuf.subarray(0, 16);
          const encrypted = encryptedBuf.subarray(16);
          const decipher = createDecipheriv("aes-256-cbc", key, iv);
          accessToken = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
        } catch {
          results[platform] = {
            success: false,
            error: `Could not decrypt ${platform} access token. Please reconnect the account.`,
          };
          continue;
        }

        // Resolve platform-specific content
        const resolvedContent =
          (platformContent as Record<string, string>)?.[platform] || content || "";

        // Publish via the adapter
        const publishResult = await adapter.publish({
          accessToken,
          content: resolvedContent,
          media: (mediaUrls || []).map((url: string) => ({
            url,
            kind: "image" as const,
          })),
          title,
          firstComment: (firstComment as Record<string, string>)?.[platform] || undefined,
          accountMetadata: (account.platform_metadata as Record<string, any>) || {},
        });

        // Record the publish target in the database
        await supabase.from("post_targets").insert({
          post_id: `pub-${Date.now()}`,
          user_id: user.id,
          social_account_id: account.id,
          platform,
          resolved_content: resolvedContent,
          status: "published",
          remote_post_id: publishResult.remotePostId,
          remote_url: publishResult.remoteUrl || null,
          published_at: new Date().toISOString(),
        });

        results[platform] = {
          success: true,
          remotePostId: publishResult.remotePostId,
          remoteUrl: publishResult.remoteUrl || undefined,
        };
      } catch (err: any) {
        console.error(`[publish] ${platform} error:`, err);
        results[platform] = {
          success: false,
          error: err.userMessage || err.message || `Failed to publish to ${platform}`,
        };
      }
    }

    const allSucceeded = Object.values(results).every((r) => r.success);
    const someSucceeded = Object.values(results).some((r) => r.success);

    return NextResponse.json({
      success: allSucceeded,
      partial: someSucceeded && !allSucceeded,
      results,
      message: allSucceeded
        ? "Published to all platforms successfully!"
        : someSucceeded
        ? "Published to some platforms. Check details for errors."
        : "Publishing failed. Check the details for each platform.",
    });
  } catch (error: any) {
    console.error("[/api/posts/publish]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
