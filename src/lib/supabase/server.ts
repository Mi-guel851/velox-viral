/**
 * Server Supabase clients.
 *
 * Two distinct clients, and the difference matters for security:
 *
 *  - `createServerSupabaseClient()` acts as the signed-in user. Row Level
 *    Security applies, so it physically cannot read another user's rows. This is
 *    the default for anything handling a request.
 *
 *  - `createAdminClient()` uses the service-role key and BYPASSES RLS. Reserved
 *    for operations that have no user session — the cron publisher, OAuth token
 *    vault access, billing webhooks. Every call site must scope by user_id
 *    itself, because the database will no longer do it.
 */
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Request-scoped client that respects RLS.
 *
 * Safe to call from server components, route handlers and server actions. In a
 * server component the cookie write is a no-op (React forbids it during
 * render), which is why token refresh is handled by middleware instead.
 */
export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a server component render, where cookies are
            // read-only. Middleware already refreshed the session, so ignoring
            // this is correct rather than a swallowed failure.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. Bypasses RLS — scope every query by user_id yourself.
 * Returns null when the service-role key is absent so callers can report a
 * configuration problem instead of crashing.
 */
export function createAdminClient() {
  if (!isSupabaseConfigured() || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // No user session to persist or refresh on a machine-to-machine client.
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/** Admin client that throws with a clear message when unavailable. */
export function requireAdminClient() {
  const client = createAdminClient();
  if (!client) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Server-side publishing, token storage and analytics collection require it."
    );
  }
  return client;
}

/**
 * The authenticated user, or null.
 *
 * Always uses `getUser()`, which verifies the JWT with the auth server, rather
 * than `getSession()`, which trusts a cookie that a client could have forged.
 * Never authorise anything off `getSession()`.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

/** Throws when there is no verified session. Use to guard route handlers. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "You must be signed in to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
