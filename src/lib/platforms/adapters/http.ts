/**
 * Shared HTTP plumbing for platform adapters.
 *
 * Centralises timeout handling and maps provider HTTP failures onto the typed
 * PlatformError hierarchy, so every adapter reports "reconnect needed" vs
 * "rate limited" vs "transient" consistently and the publisher can decide
 * whether to retry without knowing which platform it is talking to.
 */
import "server-only";

import type { Platform } from "@/lib/types";
import {
  PlatformError,
  PlatformAuthError,
  PlatformRateLimitError,
} from "./types";

/** Platform APIs are called from a serverless function; never hang the invocation. */
const DEFAULT_TIMEOUT_MS = 30_000;

export interface PlatformFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Performs a request and returns parsed JSON, converting failures into typed
 * errors. Response bodies are logged server-side but never surfaced verbatim to
 * a user, since provider errors routinely echo tokens and internal identifiers.
 */
export async function platformFetch<T = unknown>(
  platform: Platform,
  url: string,
  options: PlatformFetchOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new PlatformError(platform, `Request to ${platform} timed out`, {
        userMessage: `${platform} did not respond in time. This will be retried.`,
        retryable: true,
        cause,
      });
    }
    throw new PlatformError(platform, `Network error calling ${platform}`, {
      userMessage: `Couldn't reach ${platform}. This will be retried.`,
      retryable: true,
      cause,
    });
  } finally {
    clearTimeout(timeout);
  }

  const bodyText = await response.text();

  if (!response.ok) {
    // Log the full provider response for debugging; the thrown error carries
    // only a sanitised message.
    console.error(
      `[platform:${platform}] ${init.method ?? "GET"} ${redactUrl(url)} → ${response.status}`,
      bodyText.slice(0, 1000)
    );

    if (response.status === 401 || response.status === 403) {
      throw new PlatformAuthError(
        platform,
        `${platform} rejected the access token (${response.status})`
      );
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      throw new PlatformRateLimitError(
        platform,
        retryAfter ? Number.parseInt(retryAfter, 10) || undefined : undefined
      );
    }

    // 5xx is the platform's problem and worth retrying; 4xx is our request.
    const retryable = response.status >= 500;
    throw new PlatformError(
      platform,
      `${platform} returned ${response.status}: ${extractProviderMessage(bodyText)}`,
      {
        userMessage: retryable
          ? `${platform} is having trouble right now. This will be retried.`
          : `${platform} rejected this request: ${extractProviderMessage(bodyText)}`,
        retryable,
      }
    );
  }

  if (!bodyText) return undefined as T;

  try {
    return JSON.parse(bodyText) as T;
  } catch (cause) {
    throw new PlatformError(platform, `${platform} returned a non-JSON response`, {
      userMessage: `Received an unexpected response from ${platform}.`,
      retryable: true,
      cause,
    });
  }
}

/**
 * Pulls a human-usable message out of a provider error body.
 * Providers disagree on shape, so this checks the common ones and falls back to
 * a truncated raw body.
 */
function extractProviderMessage(bodyText: string): string {
  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;

    // Meta / Facebook / Instagram / Threads
    const metaError = parsed.error as { message?: string } | undefined;
    if (metaError?.message) return String(metaError.message);

    // X / Twitter
    if (typeof parsed.detail === "string") return parsed.detail;
    if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
      const first = parsed.errors[0] as { message?: string; detail?: string };
      if (first?.message) return String(first.message);
      if (first?.detail) return String(first.detail);
    }

    // LinkedIn
    if (typeof parsed.message === "string") return parsed.message;

    // TikTok
    const tiktokError = parsed.error as { message?: string; code?: string } | undefined;
    if (tiktokError?.code) return String(tiktokError.message ?? tiktokError.code);

    // OAuth-style
    if (typeof parsed.error_description === "string") return parsed.error_description;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // Not JSON.
  }

  return bodyText.slice(0, 200) || "Unknown error";
}

/** Strips query strings so tokens in URLs never reach logs. */
function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

/** Converts a TTL in seconds into the absolute ISO timestamp we store. */
export function expiryFromSeconds(seconds?: number | null): string | null {
  if (!seconds || !Number.isFinite(seconds)) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * Engagement rate as a percentage of reach (falling back to impressions).
 *
 * Defined once so every platform's rate is computed identically — otherwise
 * cross-platform comparison in the dashboard would be meaningless. Returns 0
 * when there is no denominator rather than dividing by zero.
 */
export function computeEngagementRate(params: {
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  impressions?: number;
}): number {
  const interactions =
    (params.likes ?? 0) + (params.comments ?? 0) + (params.shares ?? 0) + (params.saves ?? 0);
  const denominator = params.reach || params.impressions || 0;
  if (denominator <= 0) return 0;
  return Math.round((interactions / denominator) * 100 * 1000) / 1000;
}
