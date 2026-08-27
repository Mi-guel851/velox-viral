/**
 * Shared Meta Graph API plumbing for the Facebook, Instagram and Threads
 * adapters. All three speak the same OAuth dialect and the same long-lived
 * token exchange, so that logic lives here once.
 */
import "server-only";

import type { Platform } from "@/lib/types";
import type { TokenSet } from "./types";
import { platformFetch, expiryFromSeconds } from "./http";

/** Meta pins behaviour to a dated Graph version. */
export const GRAPH_VERSION = "v21.0";
export const GRAPH_API = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const FACEBOOK_OAUTH_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export interface MetaTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

/**
 * Exchanges an authorization code for a token on any Graph-based platform.
 * Note this is a GET with query parameters, not a POST body — Meta is unusual
 * in that respect.
 */
export async function exchangeMetaCode(params: {
  platform: Platform;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<TokenSet> {
  const query = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
  });

  const response = await platformFetch<MetaTokenResponse>(
    params.platform,
    `${params.tokenUrl}?${query.toString()}`
  );

  return {
    accessToken: response.access_token,
    expiresAt: expiryFromSeconds(response.expires_in),
  };
}

/**
 * Upgrades a short-lived token (roughly one hour) to a long-lived one (roughly
 * sixty days).
 *
 * Skipping this is the single most common cause of social connections that
 * "randomly" stop working an hour after being set up.
 */
export async function exchangeForLongLivedToken(params: {
  platform: Platform;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  /** Threads uses `th_exchange_token`; Facebook/Instagram use `fb_exchange_token`. */
  grantType?: string;
  exchangeParamName?: string;
}): Promise<TokenSet> {
  const grantType = params.grantType ?? "fb_exchange_token";
  const exchangeParamName = params.exchangeParamName ?? "fb_exchange_token";

  const query = new URLSearchParams({
    grant_type: grantType,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    [exchangeParamName]: params.accessToken,
  });

  const response = await platformFetch<MetaTokenResponse>(
    params.platform,
    `${params.tokenUrl}?${query.toString()}`
  );

  return {
    accessToken: response.access_token,
    expiresAt: expiryFromSeconds(response.expires_in),
  };
}

/**
 * Polls a media container until Meta finishes processing it.
 *
 * Instagram and Threads both use a two-step publish (create container, then
 * publish it) and reject the publish call while the container is still
 * `IN_PROGRESS`. Video in particular needs real time here.
 */
export async function waitForContainer(params: {
  platform: Platform;
  baseUrl: string;
  containerId: string;
  accessToken: string;
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = params.timeoutMs ?? 120_000;
  const startedAt = Date.now();
  let delay = 2_000;

  while (Date.now() - startedAt < timeoutMs) {
    const status = await platformFetch<{ status_code?: string; status?: string }>(
      params.platform,
      `${params.baseUrl}/${params.containerId}?fields=status_code,status&access_token=${encodeURIComponent(params.accessToken)}`
    );

    const code = status.status_code ?? status.status;

    if (code === "FINISHED" || code === "PUBLISHED") return;

    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(`Media container ${code}: ${status.status ?? "processing failed"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    // Back off gently, capped, so a slow video doesn't hammer the API.
    delay = Math.min(delay * 1.5, 10_000);
  }

  throw new Error("Timed out waiting for media processing");
}
