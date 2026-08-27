/**
 * Public environment configuration.
 *
 * Only `NEXT_PUBLIC_*` variables belong here — this module is safe to import
 * from client components. Server-only secrets live in `env.server.ts`, which
 * is guarded by `server-only` so importing it from the browser is a build error.
 *
 * Validation is intentionally non-throwing. A missing variable degrades the app
 * into a clearly-signposted "not configured" state instead of crashing the
 * build, so `next build` succeeds on a fresh clone with no `.env`.
 */
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const publicEnv = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
    };

/**
 * Whether Supabase is wired up. Everything user-facing keys off this: when it
 * is false the app renders a setup screen rather than pretending to have data.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Human-readable reasons Supabase is unavailable, for the setup screen. */
export function supabaseConfigErrors(): string[] {
  const errors: string[] = [];
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is missing or is not a valid URL.");
  }
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short to be a valid key.");
  }
  return errors;
}

/**
 * Canonical origin for OAuth redirect URIs and email links.
 *
 * Falls back to the Vercel-provided host, then localhost. OAuth callbacks must
 * match the value registered with each provider exactly, so this needs to be
 * set explicitly in production.
 */
export function appUrl(): string {
  if (publicEnv.NEXT_PUBLIC_APP_URL) {
    return publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
