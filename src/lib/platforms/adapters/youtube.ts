/**
 * YouTube adapter — Data API v3 with Google OAuth.
 *
 * Docs: https://developers.google.com/youtube/v3/docs/videos/insert
 *
 * Notes on the real API that shape this implementation:
 *  - `access_type=offline` plus `prompt=consent` is what makes Google return a
 *    refresh token. Google only returns one on the *first* consent, so without
 *    `prompt=consent` a reconnect silently yields no refresh token.
 *  - Uploads use the resumable protocol: a session URL is created, then the
 *    bytes are PUT to it.
 *  - Videos uploaded by an unverified Google Cloud project are locked to
 *    private by YouTube regardless of the requested status. That is reported
 *    rather than hidden.
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

const API = "https://www.googleapis.com/youtube/v3";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 5_000;

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export function createYouTubeAdapter(clientId: string, clientSecret: string): PlatformAdapter {
  return {
    platform: "youtube",
    displayName: "YouTube",
    envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    requiredScopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    capabilities: {
      textOnly: false,
      images: false,
      video: true,
      carousel: false,
      requiresMedia: true,
      requiresTitle: true,
      supportsFirstComment: true,
      supportsThreads: false,
      postMetrics: true,
      accountMetrics: true,
      refreshableTokens: true,
    },

    buildAuthorizationUrl({ redirectUri, state }: AuthorizationRequest): AuthorizationUrl {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: this.requiredScopes.join(" "),
        // Both of these are required for a refresh token to be issued.
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      });
      return { url: `${AUTHORIZE_URL}?${params.toString()}` };
    },

    async exchangeCodeForToken({ code, redirectUri }: TokenExchangeRequest): Promise<TokenSet> {
      const response = await platformFetch<GoogleTokenResponse>("youtube", TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
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
      const response = await platformFetch<GoogleTokenResponse>("youtube", TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }).toString(),
      });

      return {
        accessToken: response.access_token,
        // Google does not rotate refresh tokens; keep the existing one.
        refreshToken,
        expiresAt: expiryFromSeconds(response.expires_in),
      };
    },

    async fetchAccountIdentity(accessToken: string): Promise<AccountIdentity> {
      const response = await platformFetch<{
        items?: {
          id: string;
          snippet?: {
            title?: string;
            customUrl?: string;
            thumbnails?: { default?: { url?: string }; high?: { url?: string } };
          };
          statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
        }[];
      }>("youtube", `${API}/channels?part=snippet,statistics&mine=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const channel = response.items?.[0];
      if (!channel) {
        throw new PlatformError("youtube", "No YouTube channel on this Google account", {
          userMessage:
            "This Google account has no YouTube channel. Create a channel first, then reconnect.",
        });
      }

      return {
        platformUserId: channel.id,
        username: channel.snippet?.customUrl?.replace(/^@/, "") ?? channel.id,
        displayName: channel.snippet?.title ?? "YouTube channel",
        avatarUrl:
          channel.snippet?.thumbnails?.high?.url ?? channel.snippet?.thumbnails?.default?.url ?? null,
        // Statistics come back as strings.
        followerCount: Number.parseInt(channel.statistics?.subscriberCount ?? "0", 10) || 0,
        metadata: { channel_id: channel.id },
      };
    },

    async revokeAccess(accessToken: string): Promise<void> {
      await platformFetch("youtube", REVOKE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: accessToken }).toString(),
      });
    },

    validate({ content, media, title }: ValidationRequest): ValidationResult {
      const errors: string[] = [];

      const videos = media.filter((item) => item.kind === "video");
      if (videos.length === 0) {
        errors.push("YouTube requires a video file.");
      }
      if (videos.length > 1) {
        errors.push("YouTube accepts one video per upload.");
      }
      if (!title?.trim()) {
        errors.push("YouTube requires a video title.");
      }
      if (title && title.length > TITLE_LIMIT) {
        errors.push(`YouTube titles are limited to ${TITLE_LIMIT} characters (currently ${title.length}).`);
      }
      // YouTube rejects these outright in titles.
      if (title && /[<>]/.test(title)) {
        errors.push("YouTube titles cannot contain < or > characters.");
      }
      if (content.length > DESCRIPTION_LIMIT) {
        errors.push(
          `YouTube descriptions are limited to ${DESCRIPTION_LIMIT.toLocaleString("en-US")} characters (currently ${content.length.toLocaleString("en-US")}).`
        );
      }

      return { valid: errors.length === 0, errors };
    },

    async publish({ accessToken, content, media, title, firstComment }: PublishRequest): Promise<PublishResult> {
      const video = media.find((item) => item.kind === "video");
      if (!video) {
        throw new PlatformError("youtube", "YouTube requires a video", {
          userMessage: "YouTube uploads need a video file.",
        });
      }
      if (!title?.trim()) {
        throw new PlatformError("youtube", "YouTube requires a title", {
          userMessage: "Add a video title before publishing to YouTube.",
        });
      }

      // Hashtags in the description become clickable tags on YouTube.
      const tags = (content.match(/#([\w]+)/g) ?? [])
        .map((tag) => tag.slice(1))
        .slice(0, 15);

      const metadata = {
        snippet: {
          title: title.slice(0, TITLE_LIMIT),
          description: content.slice(0, DESCRIPTION_LIMIT),
          tags,
          categoryId: "22", // People & Blogs — the safe general-purpose default.
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false,
        },
      };

      // 1. Open a resumable upload session.
      const sessionResponse = await fetch(
        `${UPLOAD_URL}?uploadType=resumable&part=snippet,status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": video.mimeType ?? "video/mp4",
          },
          body: JSON.stringify(metadata),
          signal: AbortSignal.timeout(30_000),
        }
      );

      if (!sessionResponse.ok) {
        const text = await sessionResponse.text();
        console.error(`[platform:youtube] resumable init → ${sessionResponse.status}`, text.slice(0, 800));

        if (sessionResponse.status === 401 || sessionResponse.status === 403) {
          throw new PlatformError("youtube", "YouTube rejected the access token", {
            userMessage:
              "Your YouTube connection has expired or lacks upload permission. Reconnect the account.",
          });
        }
        throw new PlatformError("youtube", `YouTube upload init failed (${sessionResponse.status})`, {
          userMessage: "YouTube wouldn't start the upload. Please try again.",
          retryable: sessionResponse.status >= 500,
        });
      }

      const sessionUrl = sessionResponse.headers.get("location");
      if (!sessionUrl) {
        throw new PlatformError("youtube", "YouTube returned no resumable session URL", {
          userMessage: "YouTube didn't return an upload session. Please try again.",
          retryable: true,
        });
      }

      // 2. Fetch the media and PUT it to the session.
      const source = await fetch(video.url);
      if (!source.ok) {
        throw new PlatformError("youtube", `Could not download media from storage (${source.status})`, {
          userMessage: "We couldn't read the attached video. Try re-uploading it.",
          retryable: true,
        });
      }
      const bytes = Buffer.from(await source.arrayBuffer());

      const upload = await fetch(sessionUrl, {
        method: "PUT",
        headers: {
          "Content-Type": video.mimeType ?? "video/mp4",
          "Content-Length": String(bytes.byteLength),
        },
        body: new Uint8Array(bytes),
        // Video uploads are slow; allow a generous window.
        signal: AbortSignal.timeout(300_000),
      });

      if (!upload.ok) {
        const text = await upload.text();
        console.error(`[platform:youtube] resumable upload → ${upload.status}`, text.slice(0, 800));
        throw new PlatformError("youtube", `YouTube upload failed (${upload.status})`, {
          userMessage: "YouTube rejected the video upload. Check the file format and try again.",
          retryable: upload.status >= 500,
        });
      }

      const created = (await upload.json()) as {
        id?: string;
        status?: { privacyStatus?: string; uploadStatus?: string; rejectionReason?: string };
      };

      if (!created.id) {
        throw new PlatformError("youtube", "YouTube returned no video id", {
          userMessage:
            "YouTube accepted the upload but returned no video id, so we can't confirm publication.",
          retryable: true,
        });
      }

      if (created.status?.uploadStatus === "rejected") {
        throw new PlatformError(
          "youtube",
          `YouTube rejected the video: ${created.status.rejectionReason ?? "unknown"}`,
          {
            userMessage: `YouTube rejected this video${created.status.rejectionReason ? ` (${created.status.rejectionReason})` : ""}.`,
          }
        );
      }

      // An unverified Google Cloud project has its uploads locked to private.
      let visibilityNote: string | null = null;
      if (created.status?.privacyStatus && created.status.privacyStatus !== "public") {
        visibilityNote = `YouTube set this video to "${created.status.privacyStatus}" instead of public. This happens when the Google Cloud project hasn't completed YouTube API audit — verify your project to publish publicly.`;
      }

      let firstCommentError: string | null = visibilityNote;
      if (firstComment?.trim()) {
        try {
          await platformFetch("youtube", `${API}/commentThreads?part=snippet`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                videoId: created.id,
                topLevelComment: { snippet: { textOriginal: firstComment } },
              },
            }),
          });
        } catch (error) {
          const message =
            error instanceof PlatformError
              ? error.userMessage
              : "The first comment could not be posted.";
          firstCommentError = firstCommentError ? `${firstCommentError} ${message}` : message;
        }
      }

      return {
        remotePostId: created.id,
        remoteUrl: `https://www.youtube.com/watch?v=${created.id}`,
        firstCommentError,
      };
    },

    async fetchPostMetrics({ accessToken, remotePostId }: MetricsRequest): Promise<NormalizedPostMetrics> {
      const response = await platformFetch<{
        items?: {
          statistics?: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
            favoriteCount?: string;
          };
        }[];
      }>("youtube", `${API}/videos?part=statistics&id=${encodeURIComponent(remotePostId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const statistics = response.items?.[0]?.statistics;
      if (!statistics) {
        return { raw: response as unknown as NormalizedPostMetrics["raw"] };
      }

      const toNumber = (value?: string): number | undefined =>
        value === undefined ? undefined : Number.parseInt(value, 10) || 0;

      const views = toNumber(statistics.viewCount);

      return {
        impressions: views,
        videoViews: views,
        likes: toNumber(statistics.likeCount),
        comments: toNumber(statistics.commentCount),
        saves: toNumber(statistics.favoriteCount),
        raw: response as unknown as NormalizedPostMetrics["raw"],
      };
    },

    async fetchAccountMetrics({ accessToken }: AccountMetricsRequest): Promise<NormalizedAccountMetrics> {
      const response = await platformFetch<{
        items?: {
          statistics?: { subscriberCount?: string; viewCount?: string };
        }[];
      }>("youtube", `${API}/channels?part=statistics&mine=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const statistics = response.items?.[0]?.statistics;

      return {
        followers: Number.parseInt(statistics?.subscriberCount ?? "0", 10) || 0,
        impressions: Number.parseInt(statistics?.viewCount ?? "0", 10) || 0,
        raw: response as unknown as NormalizedAccountMetrics["raw"],
      };
    },
  };
}
