/**
 * LinkedIn adapter — Versioned REST API with OAuth 2.0.
 *
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/
 *
 * Notes on the real API that shape this implementation:
 *  - Every REST call must carry a `LinkedIn-Version` header (YYYYMM) plus
 *    `X-Restli-Protocol-Version: 2.0.0`, or it is rejected outright.
 *  - The member identity comes from the OpenID `/v2/userinfo` endpoint, and the
 *    author of a post is the URN `urn:li:person:{sub}`.
 *  - Images are registered first, uploaded to a returned URL, and only then
 *    referenced by URN in the post body.
 *  - LinkedIn exposes no per-post organic insights for personal profiles, so
 *    `postMetrics` is false rather than returning fabricated zeroes.
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
  ValidationRequest,
  ValidationResult,
} from "./types";
import { PlatformError, PlatformUnsupportedError } from "./types";
import { platformFetch, expiryFromSeconds } from "./http";

const REST_API = "https://api.linkedin.com/rest";
const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

/** LinkedIn pins behaviour to a monthly version string. */
const LINKEDIN_VERSION = "202411";

const CHAR_LIMIT = 3000;

interface LinkedInTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

interface LinkedInUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

function restHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

export function createLinkedInAdapter(clientId: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "linkedin",
    displayName: "LinkedIn",
    envKeys: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    requiredScopes: ["openid", "profile", "email", "w_member_social"],
    capabilities: {
      textOnly: true,
      images: true,
      video: false,
      carousel: false,
      requiresMedia: false,
      requiresTitle: false,
      supportsFirstComment: true,
      supportsThreads: false,
      // No organic per-post insights are available for member posts.
      postMetrics: false,
      accountMetrics: false,
      // Refresh tokens are only granted to approved partner apps, so treat the
      // standard case as non-refreshable and prompt a reconnect instead.
      refreshableTokens: false,
    },

    buildAuthorizationUrl({ redirectUri, state }: AuthorizationRequest): AuthorizationUrl {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope: this.requiredScopes.join(" "),
      });
      return { url: `${AUTHORIZE_URL}?${params.toString()}` };
    },

    async exchangeCodeForToken({ code, redirectUri }: TokenExchangeRequest): Promise<TokenSet> {
      const response = await platformFetch<LinkedInTokenResponse>("linkedin", TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token ?? null,
        expiresAt: expiryFromSeconds(response.expires_in),
        refreshExpiresAt: expiryFromSeconds(response.refresh_token_expires_in),
        scopes: response.scope?.split(/[\s,]+/).filter(Boolean),
      };
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const profile = await platformFetch<LinkedInUserInfo>(
        "linkedin",
        "https://api.linkedin.com/v2/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const displayName =
        profile.name ??
        [profile.given_name, profile.family_name].filter(Boolean).join(" ") ??
        "LinkedIn member";

      return {
        platformUserId: profile.sub,
        // LinkedIn does not expose the vanity URL slug via OpenID, so the email
        // local-part is the closest stable handle available.
        username: profile.email?.split("@")[0] ?? displayName.toLowerCase().replace(/\s+/g, "-"),
        displayName,
        avatarUrl: profile.picture ?? null,
        // Follower count requires organization scopes we don't request.
        followerCount: 0,
        metadata: { author_urn: `urn:li:person:${profile.sub}` },
      };
    },

    validate({ content }: ValidationRequest): ValidationResult {
      const errors: string[] = [];

      if (!content.trim()) {
        errors.push("A post needs some text.");
      }
      if (content.length > CHAR_LIMIT) {
        errors.push(
          `LinkedIn allows ${CHAR_LIMIT.toLocaleString("en-US")} characters (currently ${content.length.toLocaleString("en-US")}).`
        );
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
      const authorUrn = typeof accountMetadata.author_urn === "string" ? accountMetadata.author_urn : null;

      if (!authorUrn) {
        throw new PlatformError("linkedin", "Missing LinkedIn author URN", {
          userMessage: "This LinkedIn connection is incomplete. Reconnect the account.",
        });
      }

      const videoItem = media.find((item) => item.kind === "video");
      if (videoItem) {
        throw new PlatformUnsupportedError("linkedin", "video uploads via this integration");
      }

      const body: Record<string, unknown> = {
        author: authorUrn,
        commentary: content,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };

      const imageItem = media.find((item) => item.kind === "image");
      if (imageItem) {
        const imageUrn = await uploadImage(accessToken, authorUrn, imageItem.url);
        body.content = {
          media: {
            id: imageUrn,
            altText: imageItem.altText ?? "",
          },
        };
      }

      // LinkedIn returns the new post's URN in a header rather than the body.
      const created = await platformFetchWithHeaders(accessToken, body);

      const postUrn = created.postUrn;
      if (!postUrn) {
        throw new PlatformError("linkedin", "LinkedIn did not return a post URN", {
          userMessage:
            "LinkedIn accepted the request but returned no post id, so we can't confirm publication.",
          retryable: true,
        });
      }

      // A failed first comment must not invalidate a successful post, so it is
      // reported separately rather than thrown.
      let firstCommentError: string | null = null;
      if (firstComment?.trim()) {
        try {
          await platformFetch("linkedin", `${REST_API}/socialActions/${encodeURIComponent(postUrn)}/comments`, {
            method: "POST",
            headers: { ...restHeaders(accessToken), "Content-Type": "application/json" },
            body: JSON.stringify({
              actor: authorUrn,
              object: postUrn,
              message: { text: firstComment },
            }),
          });
        } catch (error) {
          firstCommentError =
            error instanceof PlatformError ? error.userMessage : "The first comment could not be posted.";
        }
      }

      const numericId = postUrn.split(":").pop();

      return {
        remotePostId: postUrn,
        remoteUrl: numericId ? `https://www.linkedin.com/feed/update/${postUrn}` : null,
        firstCommentError,
      };
    },
  };
}

/**
 * POSTs a share and reads the created URN out of `x-restli-id`.
 * Uses `fetch` directly because `platformFetch` returns a parsed body and this
 * endpoint's response body is empty.
 */
async function platformFetchWithHeaders(
  accessToken: string,
  body: Record<string, unknown>
): Promise<{ postUrn: string | null }> {
  const response = await fetch(`${REST_API}/posts`, {
    method: "POST",
    headers: { ...restHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[platform:linkedin] POST /rest/posts → ${response.status}`, text.slice(0, 1000));

    if (response.status === 401 || response.status === 403) {
      throw new PlatformError("linkedin", "LinkedIn rejected the access token", {
        userMessage: "Your LinkedIn connection has expired. Reconnect the account to continue publishing.",
      });
    }

    throw new PlatformError("linkedin", `LinkedIn returned ${response.status}`, {
      userMessage:
        response.status >= 500
          ? "LinkedIn is having trouble right now. This will be retried."
          : "LinkedIn rejected this post.",
      retryable: response.status >= 500,
    });
  }

  return { postUrn: response.headers.get("x-restli-id") };
}

/** Registers an upload slot, PUTs the bytes, and returns the image URN. */
async function uploadImage(accessToken: string, authorUrn: string, url: string): Promise<string> {
  const initialised = await platformFetch<{
    value: { uploadUrl: string; image: string };
  }>("linkedin", `${REST_API}/images?action=initializeUpload`, {
    method: "POST",
    headers: { ...restHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
  });

  const source = await fetch(url);
  if (!source.ok) {
    throw new PlatformError("linkedin", `Could not download media from storage (${source.status})`, {
      userMessage: "We couldn't read the attached image. Try re-uploading it.",
      retryable: true,
    });
  }
  const bytes = Buffer.from(await source.arrayBuffer());

  const upload = await fetch(initialised.value.uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": source.headers.get("content-type") ?? "image/jpeg",
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(60_000),
  });

  if (!upload.ok) {
    throw new PlatformError("linkedin", `LinkedIn image upload failed (${upload.status})`, {
      userMessage: "LinkedIn wouldn't accept that image. Try a different file.",
      retryable: upload.status >= 500,
    });
  }

  return initialised.value.image;
}
