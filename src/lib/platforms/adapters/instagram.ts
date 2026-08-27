/**
 * Instagram adapter — Instagram Graph API via a Meta app.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform
 *
 * Notes on the real API that shape this implementation:
 *  - Publishing requires an Instagram *Professional* (Business or Creator)
 *    account linked to a Facebook Page. Personal accounts cannot be published to
 *    at all, which is surfaced as a clear error rather than a silent failure.
 *  - The IG user id is discovered by walking `/me/accounts` → Page →
 *    `instagram_business_account`.
 *  - Publishing is two-phase: create a media container from a public URL, wait
 *    for Meta to finish processing it, then publish the container.
 *  - Media must be reachable by Meta's servers, so post media is served from a
 *    signed Supabase Storage URL rather than uploaded bytes.
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
  waitForContainer,
} from "./meta-shared";

const TOKEN_URL = `${GRAPH_API}/oauth/access_token`;
const CAPTION_LIMIT = 2_200;
const HASHTAG_LIMIT = 30;

export function createInstagramAdapter(clientId: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "instagram",
    displayName: "Instagram",
    envKeys: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
    requiredScopes: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
    ],
    capabilities: {
      // Instagram has no text-only post type.
      textOnly: false,
      images: true,
      video: true,
      carousel: true,
      requiresMedia: true,
      requiresTitle: false,
      supportsFirstComment: true,
      supportsThreads: false,
      postMetrics: true,
      accountMetrics: true,
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
        platform: "instagram",
        tokenUrl: TOKEN_URL,
        clientId,
        clientSecret,
        code,
        redirectUri,
      });

      // Without this the connection dies about an hour after setup.
      return exchangeForLongLivedToken({
        platform: "instagram",
        tokenUrl: TOKEN_URL,
        clientId,
        clientSecret,
        accessToken: shortLived.accessToken,
      });
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const pages = await platformFetch<{
        data: {
          id: string;
          name: string;
          access_token: string;
          instagram_business_account?: { id: string };
        }[];
      }>(
        "instagram",
        `${GRAPH_API}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
      );

      const page = pages.data?.find((item) => item.instagram_business_account?.id);
      const igUserId = page?.instagram_business_account?.id;

      if (!page || !igUserId) {
        throw new PlatformError("instagram", "No Instagram Professional account linked", {
          userMessage:
            "No Instagram Professional account was found. Instagram's API only allows publishing from a Business or Creator account linked to a Facebook Page — convert your account, link it to a Page, then reconnect.",
        });
      }

      const profile = await platformFetch<{
        id: string;
        username: string;
        name?: string;
        profile_picture_url?: string;
        followers_count?: number;
      }>(
        "instagram",
        `${GRAPH_API}/${igUserId}?fields=id,username,name,profile_picture_url,followers_count&access_token=${encodeURIComponent(page.access_token)}`
      );

      return {
        platformUserId: igUserId,
        username: profile.username,
        displayName: profile.name ?? profile.username,
        avatarUrl: profile.profile_picture_url ?? null,
        followerCount: profile.followers_count ?? 0,
        metadata: {
          ig_user_id: igUserId,
          page_id: page.id,
          // Instagram publishing uses the Page token, not the user token.
          page_access_token: page.access_token,
        },
      };
    },

    validate({ content, media }: ValidationRequest): ValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (media.length === 0) {
        errors.push("Instagram requires at least one image or video.");
      }
      if (content.length > CAPTION_LIMIT) {
        errors.push(
          `Caption exceeds Instagram's ${CAPTION_LIMIT.toLocaleString("en-US")} character limit (currently ${content.length.toLocaleString("en-US")}).`
        );
      }

      const hashtags = (content.match(/#[\wÀ-ɏ]+/g) ?? []).length;
      if (hashtags > HASHTAG_LIMIT) {
        errors.push(`Instagram allows up to ${HASHTAG_LIMIT} hashtags (${hashtags} found).`);
      }

      if (media.length > 10) {
        errors.push("An Instagram carousel can hold at most 10 items.");
      }
      if (media.length > 1 && media.some((item) => item.kind === "video")) {
        warnings.push("Mixed-media carousels can be rejected by Instagram; images only is safer.");
      }

      return { valid: errors.length === 0, errors, warnings };
    },

    async publish({
      accessToken,
      content,
      media,
      accountMetadata,
      firstComment,
    }: PublishRequest): Promise<PublishResult> {
      const igUserId =
        typeof accountMetadata.ig_user_id === "string" ? accountMetadata.ig_user_id : null;
      const token =
        typeof accountMetadata.page_access_token === "string"
          ? accountMetadata.page_access_token
          : accessToken;

      if (!igUserId) {
        throw new PlatformError("instagram", "Missing Instagram user id", {
          userMessage: "This Instagram connection is incomplete. Reconnect the account.",
        });
      }
      if (media.length === 0) {
        throw new PlatformError("instagram", "Instagram requires media", {
          userMessage: "Instagram posts need at least one image or video.",
        });
      }

      let containerId: string;

      if (media.length === 1) {
        containerId = await createContainer(igUserId, token, media[0], content);
      } else {
        // Carousel: each child container is created without a caption, then
        // wrapped in a CAROUSEL parent that carries the caption.
        const childIds: string[] = [];
        for (const item of media.slice(0, 10)) {
          childIds.push(await createContainer(igUserId, token, item, undefined, true));
        }

        const parent = await platformFetch<{ id: string }>(
          "instagram",
          `${GRAPH_API}/${igUserId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              media_type: "CAROUSEL",
              children: childIds.join(","),
              caption: content,
              access_token: token,
            }),
          }
        );
        containerId = parent.id;
      }

      // Publishing a container that is still processing fails, so wait it out.
      try {
        await waitForContainer({
          platform: "instagram",
          baseUrl: GRAPH_API,
          containerId,
          accessToken: token,
        });
      } catch (cause) {
        throw new PlatformError("instagram", `Instagram media processing failed: ${String(cause)}`, {
          userMessage:
            "Instagram couldn't process that media. Check the format and dimensions, then try again.",
          retryable: true,
          cause,
        });
      }

      const published = await platformFetch<{ id: string }>(
        "instagram",
        `${GRAPH_API}/${igUserId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: containerId, access_token: token }),
        }
      );

      if (!published.id) {
        throw new PlatformError("instagram", "Instagram returned no media id", {
          userMessage:
            "Instagram accepted the upload but returned no post id, so we can't confirm publication.",
          retryable: true,
        });
      }

      let firstCommentError: string | null = null;
      if (firstComment?.trim()) {
        try {
          await platformFetch("instagram", `${GRAPH_API}/${published.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: firstComment, access_token: token }),
          });
        } catch (error) {
          firstCommentError =
            error instanceof PlatformError
              ? error.userMessage
              : "The first comment could not be posted.";
        }
      }

      // Resolve the canonical permalink; not fatal if it fails.
      let remoteUrl: string | null = null;
      try {
        const permalink = await platformFetch<{ permalink?: string }>(
          "instagram",
          `${GRAPH_API}/${published.id}?fields=permalink&access_token=${encodeURIComponent(token)}`
        );
        remoteUrl = permalink.permalink ?? null;
      } catch {
        remoteUrl = null;
      }

      return { remotePostId: published.id, remoteUrl, firstCommentError };
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

      const metrics = ["impressions", "reach", "saved", "likes", "comments", "shares"].join(",");

      const insights = await platformFetch<{
        data: { name: string; values: { value: number }[] }[];
      }>(
        "instagram",
        `${GRAPH_API}/${remotePostId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`
      );

      const read = (name: string): number | undefined => {
        const entry = insights.data?.find((item) => item.name === name);
        const value = entry?.values?.[0]?.value;
        return typeof value === "number" ? value : undefined;
      };

      return {
        impressions: read("impressions"),
        reach: read("reach"),
        likes: read("likes"),
        comments: read("comments"),
        shares: read("shares"),
        saves: read("saved"),
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

      const profile = await platformFetch<{ followers_count?: number }>(
        "instagram",
        `${GRAPH_API}/${platformUserId}?fields=followers_count&access_token=${encodeURIComponent(token)}`
      );

      return {
        followers: profile.followers_count ?? 0,
        raw: profile as unknown as NormalizedAccountMetrics["raw"],
      };
    },
  };
}

/** Creates a single media container (image, reel, or carousel child). */
async function createContainer(
  igUserId: string,
  token: string,
  item: { url: string; kind: "image" | "video"; altText?: string | null },
  caption?: string,
  isCarouselChild = false
): Promise<string> {
  const body: Record<string, unknown> = { access_token: token };

  if (item.kind === "video") {
    // Video posts go out as Reels, which is the only supported video surface.
    body.media_type = "REELS";
    body.video_url = item.url;
  } else {
    body.image_url = item.url;
  }

  if (isCarouselChild) {
    body.is_carousel_item = true;
  }
  if (caption !== undefined) {
    body.caption = caption;
  }
  if (item.altText) {
    body.alt_text = item.altText;
  }

  const response = await platformFetch<{ id: string }>(
    "instagram",
    `${GRAPH_API}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs: 60_000,
    }
  );

  return response.id;
}
