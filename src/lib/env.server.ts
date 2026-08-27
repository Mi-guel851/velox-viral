/**
 * Server-only environment configuration.
 *
 * `server-only` makes importing this from a client component a build-time
 * error, which is the structural guarantee that no secret can reach the
 * browser bundle.
 *
 * Every integration is optional and independently gated. A feature whose
 * credentials are absent reports itself as "needs configuration" in the UI and
 * activates automatically once the variables are supplied — nothing is faked
 * and nothing silently no-ops.
 */
import "server-only";
import { z } from "zod";
import type { Platform } from "@/lib/types";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  GEMINI_API_KEY: z.string().min(10).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_BUSINESS: z.string().optional(),
});

const parsedServer = serverSchema.safeParse(process.env);

export const serverEnv = parsedServer.success
  ? parsedServer.data
  : {
      ...serverSchema.parse({}), // applies defaults
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      GEMINI_API_KEY: undefined,
      TOKEN_ENCRYPTION_KEY: undefined,
      CRON_SECRET: undefined,
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_PRICE_PRO: undefined,
      STRIPE_PRICE_BUSINESS: undefined,
    };

// ---------------------------------------------------------------------------
// Feature gates
// ---------------------------------------------------------------------------

export function hasServiceRole(): boolean {
  return Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

/** Server-side AI generation requires a Gemini key. */
export function isAIConfigured(): boolean {
  return Boolean(serverEnv.GEMINI_API_KEY);
}

/**
 * Token encryption requires a 32-byte key, supplied as 64 hex chars or base64.
 * Without it we refuse to store OAuth tokens at all rather than persisting them
 * in plaintext.
 */
export function isEncryptionConfigured(): boolean {
  return getEncryptionKey() !== null;
}

export function getEncryptionKey(): Buffer | null {
  const raw = serverEnv.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;

  // 64 hex characters
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  // base64 encoding of 32 bytes
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 32) return buf;
  } catch {
    // fall through
  }
  return null;
}

export function isBillingConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_WEBHOOK_SECRET);
}

export function isCronConfigured(): boolean {
  return Boolean(serverEnv.CRON_SECRET);
}

// ---------------------------------------------------------------------------
// Per-platform OAuth credentials
//
// Each platform names its credentials differently (client_id vs client_key,
// app secret vs client secret). This table normalises them so the adapters and
// the UI can ask one question: "is this platform configured?"
// ---------------------------------------------------------------------------

export interface PlatformCredentials {
  clientId: string;
  clientSecret: string;
}

const PLATFORM_ENV_KEYS: Record<Platform, { id: string; secret: string }> = {
  instagram: { id: "INSTAGRAM_CLIENT_ID", secret: "INSTAGRAM_CLIENT_SECRET" },
  facebook: { id: "FACEBOOK_CLIENT_ID", secret: "FACEBOOK_CLIENT_SECRET" },
  threads: { id: "THREADS_CLIENT_ID", secret: "THREADS_CLIENT_SECRET" },
  twitter: { id: "TWITTER_CLIENT_ID", secret: "TWITTER_CLIENT_SECRET" },
  linkedin: { id: "LINKEDIN_CLIENT_ID", secret: "LINKEDIN_CLIENT_SECRET" },
  tiktok: { id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET" },
  youtube: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" },
};

/** Returns credentials for a platform, or null when it is not configured. */
export function getPlatformCredentials(platform: Platform): PlatformCredentials | null {
  const keys = PLATFORM_ENV_KEYS[platform];
  if (!keys) return null;

  const clientId = process.env[keys.id];
  const clientSecret = process.env[keys.secret];
  if (!clientId || !clientSecret) return null;

  return { clientId, clientSecret };
}

export function isPlatformConfigured(platform: Platform): boolean {
  return getPlatformCredentials(platform) !== null;
}

/** The env var names a platform needs, for surfacing setup instructions in the UI. */
export function platformEnvKeys(platform: Platform): string[] {
  const keys = PLATFORM_ENV_KEYS[platform];
  return keys ? [keys.id, keys.secret] : [];
}

/**
 * Full configuration report, rendered on the Settings screen so missing
 * credentials are visible instead of silently disabling features.
 */
export function configurationReport() {
  return {
    database: hasServiceRole(),
    ai: isAIConfigured(),
    encryption: isEncryptionConfigured(),
    cron: isCronConfigured(),
    billing: isBillingConfigured(),
    platforms: Object.fromEntries(
      (Object.keys(PLATFORM_ENV_KEYS) as Platform[]).map((p) => [
        p,
        { configured: isPlatformConfigured(p), envKeys: platformEnvKeys(p) },
      ])
    ) as Record<Platform, { configured: boolean; envKeys: string[] }>,
  };
}
