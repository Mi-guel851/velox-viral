/**
 * Threads adapter — Threads API.
 *
 * Docs: https://developers.facebook.com/docs/threads
 *
 * Threads is Meta-owned but has its own host (graph.threads.net), its own
 * authorize URL, and its own token exchange grant (`th_exchange_token`), so it
 * cannot simply reuse the Facebook adapter.
 *
 * Like Instagram, publishing is two-phase: create a container, then publish it.
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
import { waitForContainer } from "./meta-shared";

const THREADS_API = "https://graph.threads.net/v1.0";
const AUTHORIZE_URL = "https://threads.net/oauth/authorize";
const TOKEN_URL = "https://graph.threads.net/oauth/access_token";
const REFRESH_URL = "https://graph.threads.net/refresh_access_token";

const CHAR_LIMIT = 500;

export function createThreadsAdapter(clientId: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "threads",
    displayName: "Threads",
    envKeys: ["THREADS_CLIENT_ID", "THREADS_CLIENT_SECRET"],
    requiredScopes: [
      "threads_basic",
      "threads_content_publish",
      "threads_manage_insights",
      "threads_manage_replies",
    ],
    capabilities: {
      textOnly: true,
      images: true,
      video: true,
      carousel: true,
      requiresMedia: false,
      requiresTitle: false,
      // Threads supports replies, which the composer models as a thread rather
      // than a "first comment".
      supportsFirstComment: true,
      supportsThreads: true,
      postMetrics: true,
      accountMetrics: true,
      refreshableTokens: true,
    },

    buildAuthorizationUrl({ redirectUri, state }: AuthorizationRequest): AuthorizationUrl {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: this.requiredScopes.join(","),
        response_type: "code",
        state,
      });
      return { url: `${AUTHORIZE_URL}?${params.toString()}` };
    },

    async exchangeCodeForToken({ code, redirectUri }: TokenExchangeRequest): Promise<TokenSet> {
      // Threads uses a POST form body here, unlike Facebook's GET query style.
      const shortLived = await platformFetch<{ access_token: string; user_id?: number }>(
        "threads",
        TOKEN_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code,
          }).toString(),
        }
      );

      // Upgrade to a 60-day token immediately.
      const longLived = await platformFetch<{ access_token: string; expires_in?: number }>(
        "threads",
        `${TOKEN_URL}?${new URLSearchParams({
          grant_type: "th_exchange_token",
          client_secret: clientSecret,
          access_token: shortLived.access_token,
        }).toString()}`
      );

      return {
        accessToken: longLived.access_token,
        expiresAt: expiryFromSeconds(longLived.expires_in),
      };
    },

    /**
     * Threads has no refresh token: a long-lived token is exchanged for a fresh
     * one using itself. It must be refreshed at least once every 60 days and
     * only becomes refreshable after 24 hours.
     */
    async refreshAccessToken(currentToken: string): Promise<TokenSet> {
      const response = await platformFetch<{ access_token: string; expires_in?: number }>(
        "threads",
        `${REFRESH_URL}?${new URLSearchParams({
          grant_type: "th_refresh_token",
          access_token: currentToken,
        }).toString()}`
      );

      return {
        accessToken: response.access_token,
        expiresAt: expiryFromSeconds(response.expires_in),
      };
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const profile = await platformFetch<{
        id: string;
        username?: string;
        name?: string;
        threads_profile_picture_url?: string;
      }>(
        "threads",
        `${THREADS_API}/me?fields=id,username,name,threads_profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
      );

      // Follower count lives on a separate insights endpoint and may be
      // unavailable on brand-new accounts, so a failure here is non-fatal.
      let followerCount = 0;
      try {
        const insights = await platformFetch<{
          data: { name: string; total_value?: { value?: number } }[];
        }>(
          "threads",
          `${THREADS_API}/${profile.id}/threads_insights?metric=followers_count&access_token=${encodeURIComponent(accessToken)}`
        );
        followerCount =
          insights.data?.find((item) => item.name === "followers_count")?.total_value?.value ?? 0;
      } catch {
        followerCount = 0;
      }

      return {
        platformUserId: profile.id,
        username: profile.username ?? profile.id,
        displayName: profile.name ?? profile.username ?? "Threads user",
        avatarUrl: profile.threads_profile_picture_url ?? null,
        followerCount,
        metadata: { threads_user_id: profile.id },
      };
    },

    validate({ content, media }: ValidationRequest): ValidationResult {
      const errors: string[] = [];

      if (!content.trim() && media.length === 0) {
        errors.push("Add text or an attachment.");
      }
      if (content.length > CHAR_LIMIT) {
        errors.push(
          `Threads posts are limited to ${CHAR_LIMIT} characters (currently ${content.length}).`
        );
      }
      if (media.length > 20) {
        errors.push("A Threads carousel can hold at most 20 items.");
      }

      return { valid: errors.length === 0, errors };
    },

    async publish({
      accessToken,
      content,
      media,
      accountMetadata,
      firstComment,
    }: PublishRequest): Promise<PublishResult> {
      const userId =
        typeof accountMetadata.threads_user_id === "string"
          ? accountMetadata.threads_user_id
          : null;

      if (!userId) {
        throw new PlatformError("threads", "Missing Threads user id", {
          userMessage: "This Threads connection is incomplete. Reconnect the account.",
        });
      }

      const containerId = await createThreadsContainer({
        userId,
        accessToken,
        content,
        media,
      });

      // Media containers need processing time; text posts are ready immediately.
      if (media.length > 0) {
        try {
          await waitForContainer({
            platform: "threads",
            baseUrl: THREADS_API,
            containerId,
            accessToken,
          });
        } catch (cause) {
          throw new PlatformError("threads", `Threads media processing failed: ${String(cause)}`, {
            userMessage: "Threads couldn't process that media. Check the format and try again.",
            retryable: true,
            cause,
          });
        }
      }

      const published = await platformFetch<{ id: string }>(
        "threads",
        `${THREADS_API}/${userId}/threads_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
        }
      );

      if (!published.id) {
        throw new PlatformError("threads", "Threads returned no post id", {
          userMessage:
            "Threads accepted the request but returned no post id, so we can't confirm publication.",
          retryable: true,
        });
      }

      // A follow-up reply is a separate post with reply_to_id set.
      let firstCommentError: string | null = null;
      if (firstComment?.trim()) {
        try {
          const replyContainer = await platformFetch<{ id: string }>(
            "threads",
            `${THREADS_API}/${userId}/threads`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                media_type: "TEXT",
                text: firstComment,
                reply_to_id: published.id,
                access_token: accessToken,
              }),
            }
          );

          await platformFetch("threads", `${THREADS_API}/${userId}/threads_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: replyContainer.id, access_token: accessToken }),
          });
        } catch (error) {
          firstCommentError =
            error instanceof PlatformError
              ? error.userMessage
              : "The follow-up reply could not be posted.";
        }
      }

      let remoteUrl: string | null = null;
      try {
        const permalink = await platformFetch<{ permalink?: string }>(
          "threads",
          `${THREADS_API}/${published.id}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`
        );
        remoteUrl = permalink.permalink ?? null;
      } catch {
        remoteUrl = null;
      }

      return { remotePostId: published.id, remoteUrl, firstCommentError };
    },

    async fetchPostMetrics({ accessToken, remotePostId }: MetricsRequest): Promise<NormalizedPostMetrics> {
      const metrics = ["views", "likes", "replies", "reposts", "quotes", "shares"].join(",");

      const insights = await platformFetch<{
        data: { name: string; values?: { value: number }[]; total_value?: { value?: number } }[];
      }>(
        "threads",
        `${THREADS_API}/${remotePostId}/insights?metric=${metrics}&access_token=${encodeURIComponent(accessToken)}`
      );

      const read = (name: string): number | undefined => {
        const entry = insights.data?.find((item) => item.name === name);
        const value = entry?.total_value?.value ?? entry?.values?.[0]?.value;
        return typeof value === "number" ? value : undefined;
      };

      return {
        // Threads reports "views" rather than impressions.
        impressions: read("views"),
        likes: read("likes"),
        comments: read("replies"),
        shares: (read("reposts") ?? 0) + (read("quotes") ?? 0) + (read("shares") ?? 0),
        raw: insights as unknown as NormalizedPostMetrics["raw"],
      };
    },

    async fetchAccountMetrics({
      accessToken,
      platformUserId,
    }: AccountMetricsRequest): Promise<NormalizedAccountMetrics> {
      const insights = await platformFetch<{
        data: { name: string; total_value?: { value?: number } }[];
      }>(
        "threads",
        `${THREADS_API}/${platformUserId}/threads_insights?metric=followers_count,views&access_token=${encodeURIComponent(accessToken)}`
      );

      const read = (name: string): number | undefined =>
        insights.data?.find((item) => item.name === name)?.total_value?.value;

      return {
        followers: read("followers_count") ?? 0,
        impressions: read("views"),
        raw: insights as unknown as NormalizedAccountMetrics["raw"],
      };
    },
  };
}

async function createThreadsContainer(params: {
  userId: string;
  accessToken: string;
  content: string;
  media: { url: string; kind: "image" | "video"; altText?: string | null }[];
}): Promise<string> {
  const { userId, accessToken, content, media } = params;

  // Single container: TEXT, IMAGE or VIDEO.
  if (media.length <= 1) {
    const body: Record<string, unknown> = { access_token: accessToken, text: content };
    const item = media[0];

    if (!item) {
      body.media_type = "TEXT";
    } else if (item.kind === "video") {
      body.media_type = "VIDEO";
      body.video_url = item.url;
    } else {
      body.media_type = "IMAGE";
      body.image_url = item.url;
      if (item.altText) body.alt_text = item.altText;
    }

    const response = await platformFetch<{ id: string }>(
      "threads",
      `${THREADS_API}/${userId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        timeoutMs: 60_000,
      }
    );
    return response.id;
  }

  // Carousel: children first (no text), then the parent carries the text.
  const childIds: string[] = [];
  for (const item of media.slice(0, 20)) {
    const body: Record<string, unknown> = {
      access_token: accessToken,
      is_carousel_item: true,
      media_type: item.kind === "video" ? "VIDEO" : "IMAGE",
    };
    if (item.kind === "video") body.video_url = item.url;
    else body.image_url = item.url;
    if (item.altText) body.alt_text = item.altText;

    const child = await platformFetch<{ id: string }>(
      "threads",
      `${THREADS_API}/${userId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        timeoutMs: 60_000,
      }
    );
    childIds.push(child.id);
  }

  const parent = await platformFetch<{ id: string }>(
    "threads",
    `${THREADS_API}/${userId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds,
        text: content,
        access_token: accessToken,
      }),
    }
  );

  return parent.id;
}
