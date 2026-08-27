/**
 * Platform adapter contract.
 *
 * Every social network implements this one interface, so the publisher, the
 * OAuth routes and the metrics collector never contain platform-specific
 * branching. Adding a network means adding an adapter and registering it —
 * nothing else in the app changes.
 *
 * Adapters are server-only: they receive decrypted tokens and must never be
 * imported from a client component.
 */
import "server-only";

import type { Platform } from "@/lib/types";
import type { Json } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Errors
//
// Typed errors let callers distinguish "the user must reconnect" from "the
// platform is down" from "the developer hasn't configured this", and surface
// the right message without leaking internals.
// ---------------------------------------------------------------------------

export class PlatformError extends Error {
  readonly platform: Platform;
  /** Safe to show a user. */
  readonly userMessage: string;
  /** Whether retrying later could succeed. */
  readonly retryable: boolean;

  constructor(
    platform: Platform,
    message: string,
    options: { userMessage?: string; retryable?: boolean; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "PlatformError";
    this.platform = platform;
    this.userMessage = options.userMessage ?? message;
    this.retryable = options.retryable ?? false;
  }
}

/** The deployment has no credentials for this platform. */
export class PlatformNotConfiguredError extends PlatformError {
  readonly envKeys: string[];

  constructor(platform: Platform, envKeys: string[]) {
    super(platform, `Platform ${platform} is not configured`, {
      userMessage: `${platform} isn't configured on this deployment yet.`,
      retryable: false,
    });
    this.name = "PlatformNotConfiguredError";
    this.envKeys = envKeys;
  }
}

/** The stored token is expired or was revoked; the user must reconnect. */
export class PlatformAuthError extends PlatformError {
  constructor(platform: Platform, message: string, cause?: unknown) {
    super(platform, message, {
      userMessage: `Your ${platform} connection has expired. Reconnect the account to continue publishing.`,
      retryable: false,
      cause,
    });
    this.name = "PlatformAuthError";
  }
}

/** Rate limited. Retryable after a delay. */
export class PlatformRateLimitError extends PlatformError {
  readonly retryAfterSeconds?: number;

  constructor(platform: Platform, retryAfterSeconds?: number, cause?: unknown) {
    super(platform, `${platform} rate limit reached`, {
      userMessage: `${platform} is rate limiting requests. This will be retried automatically.`,
      retryable: true,
      cause,
    });
    this.name = "PlatformRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** A capability the platform genuinely does not support. Never retryable. */
export class PlatformUnsupportedError extends PlatformError {
  constructor(platform: Platform, what: string) {
    super(platform, `${platform} does not support ${what}`, {
      userMessage: `${platform} doesn't support ${what}.`,
      retryable: false,
    });
    this.name = "PlatformUnsupportedError";
  }
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  /** CSRF token, persisted in oauth_states and verified on callback. */
  state: string;
}

export interface AuthorizationUrl {
  url: string;
  /** PKCE verifier to persist alongside the state, for platforms that use PKCE. */
  codeVerifier?: string;
}

export interface TokenExchangeRequest {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

/** Normalised token response. Expiries are absolute ISO timestamps, not TTLs. */
export interface TokenSet {
  accessToken: string;
  refreshToken?: string | null;
  /** ISO 8601. Null when the platform issues non-expiring tokens. */
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
  scopes?: string[];
  /** Anything platform-specific the adapter needs later (page ids, open ids...). */
  metadata?: Record<string, Json>;
}

/** Who the token belongs to on the platform. */
export interface AccountIdentity {
  platformUserId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  followerCount?: number;
  /** Routing data the publisher needs: IG business id, FB page id, YT channel id. */
  metadata?: Record<string, Json>;
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

export interface PublishMedia {
  /** Publicly reachable URL. Most platform APIs fetch media by URL, not upload. */
  url: string;
  kind: "image" | "video";
  mimeType?: string;
  altText?: string | null;
}

export interface PublishRequest {
  accessToken: string;
  /** Resolved, platform-specific copy. */
  content: string;
  media: PublishMedia[];
  /** Required by YouTube; optional elsewhere. */
  title?: string | null;
  /** Posted as a follow-up comment where the platform supports it. */
  firstComment?: string | null;
  /** platform_metadata from social_accounts (page ids, business ids...). */
  accountMetadata: Record<string, Json>;
}

/**
 * Proof of publication.
 *
 * `remotePostId` is what makes a publish real: it comes from the platform's
 * response. The publisher refuses to mark a target published without one.
 */
export interface PublishResult {
  remotePostId: string;
  remoteUrl?: string | null;
  /** Set when the post itself succeeded but the first comment did not. */
  firstCommentError?: string | null;
  raw?: Json;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/**
 * Normalised metric shape every platform maps into, so aggregation queries and
 * charts are platform-agnostic. Unsupported metrics stay undefined rather than
 * being defaulted to zero, which would misrepresent "not measured" as "zero".
 */
export interface NormalizedPostMetrics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  videoViews?: number;
  raw?: Json;
}

export interface NormalizedAccountMetrics {
  followers?: number;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  raw?: Json;
}

export interface MetricsRequest {
  accessToken: string;
  remotePostId: string;
  accountMetadata: Record<string, Json>;
}

export interface AccountMetricsRequest {
  accessToken: string;
  platformUserId: string;
  accountMetadata: Record<string, Json>;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  /** Non-blocking advice (e.g. "this will be split into 3 tweets"). */
  warnings?: string[];
}

export interface ValidationRequest {
  content: string;
  media: { kind: "image" | "video" }[];
  title?: string | null;
}

// ---------------------------------------------------------------------------
// Capabilities — drives which UI affordances are enabled per platform
// ---------------------------------------------------------------------------

export interface PlatformCapabilities {
  /** Can publish text with no media. */
  textOnly: boolean;
  images: boolean;
  video: boolean;
  /** Multi-image posts. */
  carousel: boolean;
  requiresMedia: boolean;
  requiresTitle: boolean;
  supportsFirstComment: boolean;
  supportsThreads: boolean;
  /** Per-post insights available from the API. */
  postMetrics: boolean;
  /** Account-level insights (follower counts etc.) available from the API. */
  accountMetrics: boolean;
  /** Issues refresh tokens, so connections can be kept alive automatically. */
  refreshableTokens: boolean;
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

export interface PlatformAdapter {
  readonly platform: Platform;
  readonly displayName: string;
  readonly requiredScopes: readonly string[];
  readonly capabilities: PlatformCapabilities;

  /** Env vars this platform needs, for setup messaging. */
  readonly envKeys: readonly string[];

  buildAuthorizationUrl(request: AuthorizationRequest): AuthorizationUrl;
  exchangeCodeForToken(request: TokenExchangeRequest): Promise<TokenSet>;
  /** Only defined when `capabilities.refreshableTokens` is true. */
  refreshAccessToken?(refreshToken: string): Promise<TokenSet>;
  fetchAccountIdentity(accessToken: string): Promise<AccountIdentity>;
  /** Best-effort token revocation on disconnect. */
  revokeAccess?(accessToken: string): Promise<void>;

  validate(request: ValidationRequest): ValidationResult;
  publish(request: PublishRequest): Promise<PublishResult>;

  fetchPostMetrics?(request: MetricsRequest): Promise<NormalizedPostMetrics>;
  fetchAccountMetrics?(request: AccountMetricsRequest): Promise<NormalizedAccountMetrics>;
}
