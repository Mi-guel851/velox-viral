/**
 * Facebook Pages adapter — Meta Graph API.
 *
 * Docs: https://developers.facebook.com/docs/pages-api
 *
 * Notes on the real API that shape this implementation:
 *  - You cannot post to a Page with a *user* token. `/me/accounts` returns each
 *    managed Page along with its own Page access token, and that is what must be
 *    stored and used for publishing.
 *  - Page tokens derived from a long-lived user token do not expire, which is
 *    why the short-lived token is upgraded before the Page list is fetched.
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
import { platformFetch } from "./http";
import {
  GRAPH_API,
  FACEBOOK_OAUTH_DIALOG,
  exchangeMetaCode,
  exchangeForLongLivedToken,
} from "./meta-shared";

const TOKEN_URL = `${GRAPH_API}/oauth/access_token`;
const CHAR_LIMIT = 63_206;

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  username?: string;
  followers_count?: number;
  fan_count?: number;
  picture?: { data?: { url?: string } };
}

export function createFacebookAdapter(clientId: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "facebook",
    displayName: "Facebook",
    envKeys: ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"],
    requiredScopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "read_insights",
    ],
    capabilities: {
      textOnly: true,
      images: true,
      video: true,
      carousel: false,
      requiresMedia: false,
      requiresTitle: false,
      supportsFirstComment: true,
      supportsThreads: false,
      postMetrics: true,
      accountMetrics: true,
      // Page tokens from a long-lived user token don't expire, so there is
      // nothing to refresh.
      refreshableTokens: false,
    },

    buildAuthorizationUrl({ redirectUri, state }: AuthorizationRequest): AuthorizationUrl {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        response_type: "code",
        scope: this.requiredScopes.join(","),
      });
      return { url: `${FACEBOOK_OAUTH_DIALOG}?${params.toString()}` };
    },

    async exchangeCodeForToken({ code, redirectUri }: TokenExchangeRequest): Promise<TokenSet> {
      const shortLived = await exchangeMetaCode({
        platform: "facebook",
        tokenUrl: TOKEN_URL,
        clientId,
        clientSecret,
        code,
        redirectUri,
      });

      // Upgrade immediately: the code-exchange token lasts about an hour.
      const longLived = await exchangeForLongLivedToken({
        platform: "facebook",
        tokenUrl: TOKEN_URL,
        clientId,
        clientSecret,
        accessToken: shortLived.accessToken,
      });

      return longLived;
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const pages = await platformFetch<{ data: FacebookPage[] }>(
        "facebook",
        `${GRAPH_API}/me/accounts?fields=id,name,access_token,username,followers_count,fan_count,picture{url}&access_token=${encodeURIComponent(accessToken)}`
      );

      const page = pages.data?.[0];
      if (!page) {
        throw new PlatformError("facebook", "No Facebook Pages returned for this user", {
          userMessage:
            "No Facebook Page was found on this account. Velox Viral publishes to Pages, not personal profiles — create or gain admin access to a Page, then reconnect.",
        });
      }

      return {
        platformUserId: page.id,
        username: page.username ?? page.name.toLowerCase().replace(/\s+/g, ""),
        displayName: page.name,
        avatarUrl: page.picture?.data?.url ?? null,
        followerCount: page.followers_count ?? page.fan_count ?? 0,
        metadata: {
          page_id: page.id,
          // The Page token is the credential publishing actually needs.
          page_access_token: page.access_token,
          available_pages: pages.data.map((item) => ({ id: item.id, name: item.name })),
        },
      };
    },

    validate({ content, media }: ValidationRequest): ValidationResult {
      const errors: string[] = [];

      if (!content.trim() && media.length === 0) {
        errors.push("Add text or an attachment.");
      }
      if (content.length > CHAR_LIMIT) {
        errors.push(`Facebook allows ${CHAR_LIMIT.toLocaleString("en-US")} characters.`);
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
      const pageId = typeof accountMetadata.page_id === "string" ? accountMetadata.page_id : null;
      // Prefer the stored Page token; fall back to the account token.
      const pageToken =
        typeof accountMetadata.page_access_token === "string"
          ? accountMetadata.page_access_token
          : accessToken;

      if (!pageId) {
        throw new PlatformError("facebook", "Missing Facebook Page id", {
          userMessage: "This Facebook connection is incomplete. Reconnect the account.",
        });
      }

      let remotePostId: string;

      const image = media.find((item) => item.kind === "image");
      const video = media.find((item) => item.kind === "video");

      if (video) {
        const response = await platformFetch<{ id?: string; post_id?: string }>(
          "facebook",
          `${GRAPH_API}/${pageId}/videos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_url: video.url,
              description: content,
              access_token: pageToken,
            }),
            timeoutMs: 120_000,
          }
        );
        const id = response.post_id ?? response.id;
        if (!id) {
          throw new PlatformError("facebook", "Facebook returned no video post id", {
            userMessage: "Facebook accepted the upload but returned no post id, so we can't confirm publication.",
            retryable: true,
          });
        }
        remotePostId = id;
      } else if (image) {
        const response = await platformFetch<{ id?: string; post_id?: string }>(
          "facebook",
          `${GRAPH_API}/${pageId}/photos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: image.url,
              message: content,
              access_token: pageToken,
            }),
          }
        );
        const id = response.post_id ?? response.id;
        if (!id) {
          throw new PlatformError("facebook", "Facebook returned no photo post id", {
            userMessage: "Facebook accepted the upload but returned no post id, so we can't confirm publication.",
            retryable: true,
          });
        }
        remotePostId = id;
      } else {
        const response = await platformFetch<{ id: string }>("facebook", `${GRAPH_API}/${pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, access_token: pageToken }),
        });
        if (!response.id) {
          throw new PlatformError("facebook", "Facebook returned no post id", {
            userMessage: "Facebook accepted the request but returned no post id, so we can't confirm publication.",
            retryable: true,
          });
        }
        remotePostId = response.id;
      }

      let firstCommentError: string | null = null;
      if (firstComment?.trim()) {
        try {
          await platformFetch("facebook", `${GRAPH_API}/${remotePostId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: firstComment, access_token: pageToken }),
          });
        } catch (error) {
          firstCommentError =
            error instanceof PlatformError ? error.userMessage : "The first comment could not be posted.";
        }
      }

      return {
        remotePostId,
        remoteUrl: `https://www.facebook.com/${remotePostId}`,
        firstCommentError,
      };
    },

    async fetchPostMetrics({
      accessToken,
      remotePostId,
      accountMetadata,
    }: MetricsRequest): Promise<NormalizedPostMetrics> {
      const token =
        typeof accountMetadata.page_access_token === "string"
          ? accountMetadata.page_access_token
          : accessToken;

      const metrics = [
        "post_impressions",
        "post_impressions_unique",
        "post_reactions_by_type_total",
        "post_clicks",
      ].join(",");

      const insights = await platformFetch<{
        data: { name: string; values: { value: unknown }[] }[];
      }>(
        "facebook",
        `${GRAPH_API}/${remotePostId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`
      );

      const read = (name: string): number => {
        const entry = insights.data?.find((item) => item.name === name);
        const value = entry?.values?.[0]?.value;
        return typeof value === "number" ? value : 0;
      };

      // Reactions come back as a map of type → count.
      const reactionsEntry = insights.data?.find((item) => item.name === "post_reactions_by_type_total");
      const reactionsValue = reactionsEntry?.values?.[0]?.value;
      const likes =
        reactionsValue && typeof reactionsValue === "object"
          ? Object.values(reactionsValue as Record<string, number>).reduce(
              (sum, count) => sum + (typeof count === "number" ? count : 0),
              0
            )
          : 0;

      // Comment and share counts are on the post object, not in insights.
      const engagement = await platformFetch<{
        comments?: { summary?: { total_count?: number } };
        shares?: { count?: number };
      }>(
        "facebook",
        `${GRAPH_API}/${remotePostId}?fields=comments.summary(true),shares&access_token=${encodeURIComponent(token)}`
      );

      return {
        impressions: read("post_impressions"),
        reach: read("post_impressions_unique"),
        likes,
        comments: engagement.comments?.summary?.total_count ?? 0,
        shares: engagement.shares?.count ?? 0,
        clicks: read("post_clicks"),
        raw: insights as unknown as NormalizedPostMetrics["raw"],
      };
    },

    async fetchAccountMetrics({
      accessToken,
      platformUserId,
      accountMetadata,
    }: AccountMetricsRequest): Promise<NormalizedAccountMetrics> {
      const token =
        typeof accountMetadata.page_access_token === "string"
          ? accountMetadata.page_access_token
          : accessToken;

      const page = await platformFetch<{ followers_count?: number; fan_count?: number }>(
        "facebook",
        `${GRAPH_API}/${platformUserId}?fields=followers_count,fan_count&access_token=${encodeURIComponent(token)}`
      );

      return {
        followers: page.followers_count ?? page.fan_count ?? 0,
        raw: page as unknown as NormalizedAccountMetrics["raw"],
      };
    },
  };
}
