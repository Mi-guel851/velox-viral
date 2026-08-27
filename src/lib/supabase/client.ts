/**
 * Browser Supabase client.
 *
 * Uses `@supabase/ssr` so the session is stored in cookies rather than
 * localStorage, which is what lets the server (middleware, server components,
 * route handlers) read the same session. Only ever holds the anon key, so every
 * query it makes is still constrained by Row Level Security.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

// A single instance per tab: multiple GoTrue clients on one page fight over
// token refresh and can log the user out.
let cached: BrowserClient | null = null;

/**
 * Returns the browser client, or `null` when Supabase is not configured.
 * Callers must handle null so the app can render a setup state instead of
 * throwing on a fresh clone.
 */
export function getSupabaseBrowserClient(): BrowserClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;

  cached = createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cached;
}

/**
 * Same client, but throws when unconfigured. Use inside components that are
 * only reachable behind a configuration guard.
 */
export function requireSupabaseBrowserClient(): BrowserClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
}
