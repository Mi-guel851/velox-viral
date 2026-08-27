/**
 * X (Twitter) adapter — API v2 with OAuth 2.0 PKCE.
 *
 * Docs: https://docs.x.com/x-api
 *
 * Notes on the real API that shape this implementation:
 *  - X is a *confidential* client here, so the token endpoint needs HTTP Basic
 *    auth with client_id:client_secret in addition to the PKCE verifier.
 *  - `offline.access` is what makes a refresh token available; without it the
 *    connection dies in two hours.
 *  - Media must be uploaded to a separate host before it can be attached, and
 *    the upload returns an id that is then referenced by the tweet.
 */
import "server-only";

import { createHash, randomBytes } from "node:crypto";
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

const API = "https://api.x.com/2";
const UPLOAD_API = "https://api.x.com/2/media/upload";
const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";

const TWEET_LIMIT = 280;

interface XTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

interface XUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    public_metrics?: {
      followers_count?: number;
      following_count?: number;
      tweet_count?: number;
      listed_count?: number;
    };
  };
}

interface XTweetResponse {
  data: { id: string; text: string };
}

interface XMetricsResponse {
  data: {
    id: string;
    public_metrics?: {
      retweet_count?: number;
      reply_count?: number;
      like_count?: number;
      quote_count?: number;
      bookmark_count?: number;
      impression_count?: number;
    };
    organic_metrics?: {
      impression_count?: number;
      like_count?: number;
      reply_count?: number;
      retweet_count?: number;
      user_profile_clicks?: number;
    };
  };
}

/** Generates a PKCE verifier and its S256 challenge. */
function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

/**
 * Splits long copy into a thread on paragraph, then sentence, boundaries.
 * Exported because the composer previews the same split the publisher will use.
 */
export function splitIntoThread(content: string, limit = TWEET_LIMIT): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // Reserve room for the " (n/m)" counter that gets appended below.
  const effectiveLimit = limit - 8;
  if (trimmed.length <= limit) return [trimmed];

  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const paragraph of trimmed.split(/\n\n+/)) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= effectiveLimit) {
      current = candidate;
      continue;
    }

    pushCurrent();

    if (paragraph.length <= effectiveLimit) {
      current = paragraph;
      continue;
    }

    // Paragraph alone is too long: fall back to sentences, then hard-wrap words.
    const sentences = paragraph.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [paragraph];
    for (const sentence of sentences) {
      if ((current + sentence).length <= effectiveLimit) {
        current += sentence;
        continue;
      }
      pushCurrent();

      if (sentence.length <= effectiveLimit) {
        current = sentence;
        continue;
      }
      for (const word of sentence.split(/\s+/)) {
        if ((current ? `${current} ${word}` : word).length <= effectiveLimit) {
          current = current ? `${current} ${word}` : word;
        } else {
          pushCurrent();
          current = word.slice(0, effectiveLimit);
        }
      }
    }
  }
  pushCurrent();

  if (chunks.length <= 1) return chunks;
  return chunks.map((chunk, index) => `${chunk}\n\n(${index + 1}/${chunks.length})`);
}

export function createTwitterAdapter(clientId: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "twitter",
    displayName: "X (Twitter)",
    envKeys: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
    requiredScopes: [
      "tweet.read",
      "tweet.write",
      "users.read",
      "media.write",
      // Required for a refresh token to be issued at all.
      "offline.access",
    ],
    capabilities: {
      textOnly: true,
      images: true,
      video: true,
      carousel: true,
      requiresMedia: false,
      requiresTitle: false,
      supportsFirstComment: false,
      supportsThreads: true,
      postMetrics: true,
      accountMetrics: true,
      refreshableTokens: true,
    },

    buildAuthorizationUrl({ redirectUri, state }: AuthorizationRequest): AuthorizationUrl {
      const { verifier, challenge } = createPkcePair();

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: this.requiredScopes.join(" "),
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      });

      return { url: `${AUTHORIZE_URL}?${params.toString()}`, codeVerifier: verifier };
    },

    async exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier,
    }: TokenExchangeRequest): Promise<TokenSet> {
      if (!codeVerifier) {
        throw new PlatformError("twitter", "Missing PKCE code verifier", {
          userMessage: "The X connection attempt expired. Please try connecting again.",
        });
      }

      const response = await platformFetch<XTokenResponse>("twitter", TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuthHeader(clientId, clientSecret),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token ?? null,
        expiresAt: expiryFromSeconds(response.expires_in),
        scopes: response.scope?.split(" "),
      };
    },

    async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
      const response = await platformFetch<XTokenResponse>("twitter", TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuthHeader(clientId, clientSecret),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      });

      return {
        accessToken: response.access_token,
        // X rotates refresh tokens: the old one is invalid after this call, so
        // the new one must replace it.
        refreshToken: response.refresh_token ?? null,
        expiresAt: expiryFromSeconds(response.expires_in),
        scopes: response.scope?.split(" "),
      };
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const response = await platformFetch<XUserResponse>(
        "twitter",
        `${API}/users/me?user.fields=profile_image_url,public_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return {
        platformUserId: response.data.id,
        username: response.data.username,
        displayName: response.data.name,
        avatarUrl: response.data.profile_image_url?.replace("_normal", "_400x400") ?? null,
        followerCount: response.data.public_metrics?.followers_count ?? 0,
      };
    },

    async revokeAccess(accessToken: string): Promise<void> {
      await platformFetch("twitter", `${API}/oauth2/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuthHeader(clientId, clientSecret),
        },
        body: new URLSearchParams({ token: accessToken, token_type_hint: "access_token" }).toString(),
      });
    },

    validate({ content }: ValidationRequest): ValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!content.trim()) {
        errors.push("A post needs some text.");
      }

      const parts = splitIntoThread(content);
      if (parts.length > 1) {
        warnings.push(`Over ${TWEET_LIMIT} characters — this will publish as a ${parts.length}-post thread.`);
      }
      if (parts.length > 25) {
        errors.push(`Too long: this would become ${parts.length} posts. Trim it below 25.`);
      }

      return { valid: errors.length === 0, errors, warnings };
    },

    async publish({ accessToken, content, media }: PublishRequest): Promise<PublishResult> {
      // Upload media first; ids are attached to the first post of the thread.
      const mediaIds: string[] = [];
      for (const item of media.slice(0, 4)) {
        mediaIds.push(await uploadMedia(accessToken, item.url, item.kind));
      }

      const parts = splitIntoThread(content);
      if (parts.length === 0) {
        throw new PlatformError("twitter", "Nothing to publish", {
          userMessage: "There's no content to publish.",
        });
      }

      let rootId: string | null = null;
      let previousId: string | null = null;

      for (const [index, text] of parts.entries()) {
        const body: Record<string, unknown> = { text };

        if (index === 0 && mediaIds.length > 0) {
          body.media = { media_ids: mediaIds };
        }
        if (previousId) {
          body.reply = { in_reply_to_tweet_id: previousId };
        }

        const response = await platformFetch<XTweetResponse>("twitter", `${API}/tweets`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        previousId = response.data.id;
        rootId ??= response.data.id;
      }

      if (!rootId) {
        throw new PlatformError("twitter", "X did not return a post id", {
          userMessage: "X accepted the request but returned no post id, so we can't confirm publication.",
          retryable: true,
        });
      }

      return { remotePostId: rootId, remoteUrl: `https://x.com/i/web/status/${rootId}` };
    },

    async fetchPostMetrics({ accessToken, remotePostId }: MetricsRequest): Promise<NormalizedPostMetrics> {
      const response = await platformFetch<XMetricsResponse>(
        "twitter",
        `${API}/tweets/${remotePostId}?tweet.fields=public_metrics,organic_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const publicMetrics = response.data.public_metrics ?? {};
      // organic_metrics needs elevated access; prefer it when present since it
      // excludes promoted activity.
      const organic = response.data.organic_metrics;

      return {
        impressions: organic?.impression_count ?? publicMetrics.impression_count,
        likes: organic?.like_count ?? publicMetrics.like_count,
        comments: organic?.reply_count ?? publicMetrics.reply_count,
        shares:
          (organic?.retweet_count ?? publicMetrics.retweet_count ?? 0) +
          (publicMetrics.quote_count ?? 0),
        saves: publicMetrics.bookmark_count,
        clicks: organic?.user_profile_clicks,
        raw: response as unknown as NormalizedPostMetrics["raw"],
      };
    },

    async fetchAccountMetrics({ accessToken }: AccountMetricsRequest): Promise<NormalizedAccountMetrics> {
      const response = await platformFetch<XUserResponse>(
        "twitter",
        `${API}/users/me?user.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return {
        followers: response.data.public_metrics?.followers_count ?? 0,
        raw: response as unknown as NormalizedAccountMetrics["raw"],
      };
    },
  };
}

/**
 * Uploads one media file using the chunked upload endpoint.
 *
 * X requires INIT → APPEND → FINALIZE even for small files, and video is not
 * usable until processing completes, so FINALIZE is followed by a status poll.
 */
async function uploadMedia(
  accessToken: string,
  url: string,
  kind: "image" | "video"
): Promise<string> {
  const source = await fetch(url);
  if (!source.ok) {
    throw new PlatformError("twitter", `Could not download media from storage (${source.status})`, {
      userMessage: "We couldn't read the attached media. Try re-uploading it.",
      retryable: true,
    });
  }

  const buffer = Buffer.from(await source.arrayBuffer());
  const mimeType = source.headers.get("content-type") ?? (kind === "video" ? "video/mp4" : "image/jpeg");

  const initResponse = await platformFetch<{ data: { id: string } }>("twitter", UPLOAD_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      command: "INIT",
      total_bytes: String(buffer.byteLength),
      media_type: mimeType,
      media_category: kind === "video" ? "tweet_video" : "tweet_image",
    }).toString(),
  });

  const mediaId = initResponse.data.id;

  // 5 MB chunks, comfortably inside X's per-chunk ceiling.
  const CHUNK_SIZE = 5 * 1024 * 1024;
  for (let index = 0, offset = 0; offset < buffer.byteLength; index += 1, offset += CHUNK_SIZE) {
    const chunk = buffer.subarray(offset, Math.min(offset + CHUNK_SIZE, buffer.byteLength));

    const form = new FormData();
    form.set("command", "APPEND");
    form.set("media_id", mediaId);
    form.set("segment_index", String(index));
    form.set("media", new Blob([new Uint8Array(chunk)], { type: mimeType }));

    await platformFetch("twitter", UPLOAD_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
      timeoutMs: 60_000,
    });
  }

  const finalize = await platformFetch<{
    data: { id: string; processing_info?: { state: string; check_after_secs?: number } };
  }>("twitter", `${UPLOAD_API}/${mediaId}/finalize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Video needs transcoding before it can be attached to a post.
  let processing = finalize.data.processing_info;
  let waited = 0;
  while (processing && processing.state !== "succeeded" && waited < 120_000) {
    if (processing.state === "failed") {
      throw new PlatformError("twitter", "X failed to process the uploaded video", {
        userMessage: "X couldn't process that video. Check the format and length, then try again.",
      });
    }

    const delay = Math.max((processing.check_after_secs ?? 3) * 1000, 1000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    waited += delay;

    const status = await platformFetch<{
      data: { processing_info?: { state: string; check_after_secs?: number } };
    }>("twitter", `${UPLOAD_API}?media_id=${mediaId}&command=STATUS`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    processing = status.data.processing_info;
  }

  if (processing && processing.state !== "succeeded") {
    throw new PlatformError("twitter", "Timed out waiting for X media processing", {
      userMessage: "X is still processing that video. Try publishing again in a moment.",
      retryable: true,
    });
  }

  return mediaId;
}
