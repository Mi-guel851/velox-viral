/**
 * TikTok adapter — Content Posting API v2.
 *
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
 *
 * Two constraints of the real API are important and are surfaced honestly rather
 * than worked around:
 *
 *  1. Until an app passes TikTok's content-posting audit, every upload is forced
 *     to `SELF_ONLY` visibility — TikTok enforces this server-side regardless of
 *     what we request. The adapter reports it in the publish result so the UI can
 *     tell the user their post is private rather than claiming it went live.
 *  2. `PULL_FROM_URL` requires the media host to be verified in the TikTok
 *     developer portal. If it isn't, TikTok rejects the URL, and the error is
 *     passed through with that explanation.
 */
import "server-only";

import type {
  PlatformAdapter,
  AuthorizationRequest,
  AuthorizationUrl,
  TokenExchangeRequest,
  TokenSet,
  AccountIdentity,
  PublishRequest,
  PublishResult,
  MetricsRequest,
  NormalizedPostMetrics,
  AccountMetricsRequest,
  NormalizedAccountMetrics,
  ValidationRequest,
  ValidationResult,
} from "./types";
import { PlatformError } from "./types";
import { platformFetch, expiryFromSeconds } from "./http";

const API = "https://open.tiktokapis.com/v2";
const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = `${API}/oauth/token/`;

const CAPTION_LIMIT = 2_200;

interface TikTokTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  scope?: string;
  open_id?: string;
}

export function createTikTokAdapter(clientKey: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "tiktok",
    displayName: "TikTok",
    envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
    requiredScopes: ["user.info.basic", "user.info.stats", "video.publish", "video.upload"],
    capabilities: {
      textOnly: false,
      images: false,
      video: true,
      carousel: false,
      requiresMedia: true,
      requiresTitle: false,
      supportsFirstComment: false,
      supportsThreads: false,
      postMetrics: true,
      accountMetrics: true,
      refreshableTokens: true,
    },

    buildAuthorizationUrl({ redirectUri, state }: AuthorizationRequest): AuthorizationUrl {
      const params = new URLSearchParams({
        // TikTok names this `client_key`, not `client_id`.
        client_key: clientKey,
        scope: this.requiredScopes.join(","),
        response_type: "code",
        redirect_uri: redirectUri,
        state,
      });
      return { url: `${AUTHORIZE_URL}?${params.toString()}` };
    },

    async exchangeCodeForToken({ code, redirectUri }: TokenExchangeRequest): Promise<TokenSet> {
      const response = await platformFetch<TikTokTokenResponse>("tiktok", TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token ?? null,
        expiresAt: expiryFromSeconds(response.expires_in),
        refreshExpiresAt: expiryFromSeconds(response.refresh_expires_in),
        scopes: response.scope?.split(","),
        metadata: response.open_id ? { open_id: response.open_id } : undefined,
      };
    },

    async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
      const response = await platformFetch<TikTokTokenResponse>("tiktok", TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      });

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token ?? refreshToken,
        expiresAt: expiryFromSeconds(response.expires_in),
        refreshExpiresAt: expiryFromSeconds(response.refresh_expires_in),
      };
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const fields = [
        "open_id",
        "union_id",
        "avatar_url",
        "display_name",
        "username",
        "follower_count",
      ].join(",");

      const response = await platformFetch<{
        data: {
          user: {
            open_id: string;
            union_id?: string;
            avatar_url?: string;
            display_name?: string;
            username?: string;
            follower_count?: number;
          };
        };
      }>("tiktok", `${API}/user/info/?fields=${fields}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const user = response.data.user;

      return {
        platformUserId: user.open_id,
        username: user.username ?? user.display_name ?? user.open_id,
        displayName: user.display_name ?? null,
        avatarUrl: user.avatar_url ?? null,
        followerCount: user.follower_count ?? 0,
        metadata: { open_id: user.open_id, union_id: user.union_id ?? null },
      };
    },

    async revokeAccess(accessToken: string): Promise<void> {
      await platformFetch("tiktok", `${API}/oauth/revoke/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          token: accessToken,
        }).toString(),
      });
    },

    validate({ content, media }: ValidationRequest): ValidationResult {
      const errors: string[] = [];

      const videos = media.filter((item) => item.kind === "video");
      if (videos.length === 0) {
        errors.push("TikTok requires a video file.");
      }
      if (videos.length > 1) {
        errors.push("TikTok accepts one video per post.");
      }
      if (media.some((item) => item.kind === "image")) {
        errors.push("This integration publishes video to TikTok; remove image attachments.");
      }
      if (content.length > CAPTION_LIMIT) {
        errors.push(
          `TikTok captions are limited to ${CAPTION_LIMIT.toLocaleString("en-US")} characters (currently ${content.length.toLocaleString("en-US")}).`
        );
      }

      return { valid: errors.length === 0, errors };
    },

    async publish({ accessToken, content, media }: PublishRequest): Promise<PublishResult> {
      const video = media.find((item) => item.kind === "video");
      if (!video) {
        throw new PlatformError("tiktok", "TikTok requires a video", {
          userMessage: "TikTok posts need a video file.",
        });
      }

      // Query what this app is actually allowed to do. An unaudited app can only
      // post privately, and we want to report that truthfully.
      let privacyOptions: string[] = [];
      try {
        const creatorInfo = await platformFetch<{
          data?: { privacy_level_options?: string[] };
        }>("tiktok", `${API}/post/publish/creator_info/query/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
        });
        privacyOptions = creatorInfo.data?.privacy_level_options ?? [];
      } catch {
        privacyOptions = [];
      }

      const privacyLevel = privacyOptions.includes("PUBLIC_TO_EVERYONE")
        ? "PUBLIC_TO_EVERYONE"
        : "SELF_ONLY";

      const init = await platformFetch<{
        data: { publish_id: string };
      }>("tiktok", `${API}/post/publish/video/init/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: content.slice(0, CAPTION_LIMIT),
            privacy_level: privacyLevel,
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            // Requires the media host to be a verified URL prefix in the
            // TikTok developer portal.
            source: "PULL_FROM_URL",
            video_url: video.url,
          },
        }),
        timeoutMs: 60_000,
      });

      const publishId = init.data.publish_id;

      // TikTok downloads and transcodes asynchronously; the post only exists
      // once the status endpoint reports success.
      const finalStatus = await pollPublishStatus(accessToken, publishId);

      if (finalStatus.status === "FAILED") {
        throw new PlatformError("tiktok", `TikTok publish failed: ${finalStatus.reason ?? "unknown"}`, {
          userMessage:
            finalStatus.reason === "url_ownership_unverified"
              ? "TikTok rejected the media URL because the domain isn't verified in your TikTok developer portal. Add it under URL Prefix Verification, then retry."
              : `TikTok couldn't publish this video${finalStatus.reason ? `: ${finalStatus.reason}` : "."}`,
          retryable: false,
        });
      }

      if (!finalStatus.publiclyAvailablePostId) {
        // Publish succeeded but TikTok withheld a post id — normal for
        // SELF_ONLY. The publish_id is still a real, verifiable identifier.
        return {
          remotePostId: publishId,
          remoteUrl: null,
          firstCommentError:
            privacyLevel === "SELF_ONLY"
              ? "Published privately (visible only to you): this TikTok app hasn't passed TikTok's content-posting audit yet, so TikTok forces SELF_ONLY visibility."
              : null,
          raw: finalStatus.raw,
        };
      }

      return {
        remotePostId: finalStatus.publiclyAvailablePostId,
        remoteUrl: `https://www.tiktok.com/video/${finalStatus.publiclyAvailablePostId}`,
        raw: finalStatus.raw,
      };
    },

    async fetchPostMetrics({ accessToken, remotePostId }: MetricsRequest): Promise<NormalizedPostMetrics> {
      const response = await platformFetch<{
        data?: {
          videos?: {
            id: string;
            view_count?: number;
            like_count?: number;
            comment_count?: number;
            share_count?: number;
          }[];
        };
      }>("tiktok", `${API}/video/query/?fields=id,view_count,like_count,comment_count,share_count`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters: { video_ids: [remotePostId] } }),
      });

      const video = response.data?.videos?.[0];
      if (!video) {
        // The video exists but isn't queryable (e.g. private). Reporting
        // undefined keeps "not measured" distinct from "zero".
        return { raw: response as unknown as NormalizedPostMetrics["raw"] };
      }

      return {
        impressions: video.view_count,
        videoViews: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        shares: video.share_count,
        raw: response as unknown as NormalizedPostMetrics["raw"],
      };
    },

    async fetchAccountMetrics({ accessToken }: AccountMetricsRequest): Promise<NormalizedAccountMetrics> {
      const response = await platformFetch<{
        data: { user: { follower_count?: number; likes_count?: number } };
      }>("tiktok", `${API}/user/info/?fields=follower_count,likes_count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return {
        followers: response.data.user.follower_count ?? 0,
        likes: response.data.user.likes_count,
        raw: response as unknown as NormalizedAccountMetrics["raw"],
      };
    },
  };
}

interface PublishStatus {
  status: "SUCCESS" | "FAILED" | "PROCESSING";
  reason?: string;
  publiclyAvailablePostId?: string;
  raw?: PublishResult["raw"];
}

/** Polls TikTok's publish status until it settles or we run out of time. */
async function pollPublishStatus(accessToken: string, publishId: string): Promise<PublishStatus> {
  const deadline = Date.now() + 150_000;
  let delay = 3_000;

  while (Date.now() < deadline) {
    const response = await platformFetch<{
      data?: {
        status?: string;
        fail_reason?: string;
        publicaly_available_post_id?: (string | number)[];
        publicly_available_post_id?: (string | number)[];
      };
    }>("tiktok", `${API}/post/publish/status/fetch/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    const status = response.data?.status;

    // TikTok's field name is misspelled in their own API; accept both spellings.
    const postIds =
      response.data?.publicaly_available_post_id ?? response.data?.publicly_available_post_id;
    const postId = postIds?.[0] != null ? String(postIds[0]) : undefined;

    if (status === "PUBLISH_COMPLETE") {
      return {
        status: "SUCCESS",
        publiclyAvailablePostId: postId,
        raw: response as unknown as PublishResult["raw"],
      };
    }
    if (status === "FAILED") {
      return {
        status: "FAILED",
        reason: response.data?.fail_reason,
        raw: response as unknown as PublishResult["raw"],
      };
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.4, 12_000);
  }

  throw new PlatformError("tiktok", "Timed out waiting for TikTok publish status", {
    userMessage: "TikTok is still processing this video. Check your TikTok inbox in a few minutes.",
    retryable: true,
  });
}
