/**
 * Platform adapter registry.
 *
 * The single place that knows which platforms exist and whether each one is
 * configured. Adapters are constructed lazily with their credentials, so an
 * unconfigured platform has no adapter at all — that is what makes it impossible
 * to accidentally "connect" a platform whose credentials are missing.
 *
 * Adding a platform: write the adapter, add one line to FACTORIES, done.
 */
import "server-only";

import type { Platform } from "@/lib/types";
import { getPlatformCredentials, platformEnvKeys, isPlatformConfigured } from "@/lib/env.server";
import { ALL_PLATFORMS } from "@/lib/platforms/constants";
import type { PlatformAdapter } from "./types";
import { PlatformNotConfiguredError } from "./types";

import { createTwitterAdapter } from "./twitter";
import { createLinkedInAdapter } from "./linkedin";
import { createFacebookAdapter } from "./facebook";
import { createInstagramAdapter } from "./instagram";
import { createThreadsAdapter } from "./threads";
import { createTikTokAdapter } from "./tiktok";
import { createYouTubeAdapter } from "./youtube";

type AdapterFactory = (clientId: string, clientSecret: string) => PlatformAdapter;

const FACTORIES: Record<Platform, AdapterFactory> = {
  twitter: createTwitterAdapter,
  linkedin: createLinkedInAdapter,
  facebook: createFacebookAdapter,
  instagram: createInstagramAdapter,
  threads: createThreadsAdapter,
  tiktok: createTikTokAdapter,
  youtube: createYouTubeAdapter,
};

// Adapters are stateless once built, so one instance per platform is reused for
// the lifetime of the server process.
const cache = new Map<Platform, PlatformAdapter>();

/** Returns the adapter for a platform, or null when it isn't configured. */
export function getAdapter(platform: Platform): PlatformAdapter | null {
  const cached = cache.get(platform);
  if (cached) return cached;

  const factory = FACTORIES[platform];
  if (!factory) return null;

  const credentials = getPlatformCredentials(platform);
  if (!credentials) return null;

  const adapter = factory(credentials.clientId, credentials.clientSecret);
  cache.set(platform, adapter);
  return adapter;
}

/** Adapter or a typed error naming the missing env vars. */
export function requireAdapter(platform: Platform): PlatformAdapter {
  const adapter = getAdapter(platform);
  if (!adapter) {
    throw new PlatformNotConfiguredError(platform, platformEnvKeys(platform));
  }
  return adapter;
}

export function isSupportedPlatform(value: string): value is Platform {
  return (ALL_PLATFORMS as string[]).includes(value);
}

/**
 * Per-platform configuration status for the UI.
 *
 * The accounts screen renders straight from this: a configured platform gets a
 * working Connect button, an unconfigured one gets a disabled button that names
 * the variables an operator needs to set. Nothing is ever shown as connectable
 * when it isn't.
 */
export interface PlatformAvailability {
  platform: Platform;
  displayName: string;
  configured: boolean;
  /** Env vars required to enable this platform. */
  envKeys: string[];
  /** Only present when configured. */
  capabilities?: PlatformAdapter["capabilities"];
  requiredScopes?: string[];
}

export function getPlatformAvailability(platform: Platform): PlatformAvailability {
  const adapter = getAdapter(platform);
  const envKeys = platformEnvKeys(platform);

  if (!adapter) {
    return {
      platform,
      // Fall back to the static constants table so the UI still has a proper
      // display name for an unconfigured platform.
      displayName: platform,
      configured: false,
      envKeys,
    };
  }

  return {
    platform,
    displayName: adapter.displayName,
    configured: true,
    envKeys,
    capabilities: adapter.capabilities,
    requiredScopes: [...adapter.requiredScopes],
  };
}

export function getAllPlatformAvailability(): PlatformAvailability[] {
  return ALL_PLATFORMS.map(getPlatformAvailability);
}

/** Platforms that can actually be connected right now. */
export function getConfiguredPlatforms(): Platform[] {
  return ALL_PLATFORMS.filter(isPlatformConfigured);
}

export * from "./types";
