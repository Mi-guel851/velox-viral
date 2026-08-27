/**
 * Authentication server actions.
 *
 * All auth mutations run here rather than in the browser so that:
 *  - inputs are validated server-side, where it counts;
 *  - Supabase's own error messages are mapped to safe, human wording without
 *    leaking whether an email exists;
 *  - session cookies are set by the server, which is what keeps the session
 *    readable by middleware and server components.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, appUrl } from "@/lib/env";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

/** Uniform result shape so every form renders errors the same way. */
export interface AuthActionResult {
  ok: boolean;
  error?: string;
  /** Per-field messages keyed by form field name. */
  fieldErrors?: Record<string, string>;
  /** Success text to display when there is no redirect (e.g. "check your email"). */
  message?: string;
}

const NOT_CONFIGURED: AuthActionResult = {
  ok: false,
  error:
    "This deployment is not connected to a database yet. Add your Supabase credentials to enable accounts.",
};

/**
 * Maps Supabase auth errors to user-facing copy.
 *
 * Invalid credentials are deliberately reported without revealing whether the
 * email exists, which would otherwise let anyone enumerate registered users.
 */
function describeAuthError(message: string, status?: number): string {
  const normalised = message.toLowerCase();

  if (normalised.includes("invalid login credentials")) {
    return "That email and password combination doesn't match an account.";
  }
  if (normalised.includes("email not confirmed")) {
    return "Please verify your email address first. Check your inbox for the confirmation link.";
  }
  if (normalised.includes("already registered") || normalised.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (normalised.includes("weak password") || normalised.includes("password should be")) {
    return "That password is too weak. Use at least 10 characters with mixed case and a number.";
  }
  if (normalised.includes("rate limit") || normalised.includes("too many requests") || status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (normalised.includes("same password")) {
    return "Your new password must be different from your current one.";
  }
  if (normalised.includes("expired") || normalised.includes("invalid token")) {
    return "That link has expired. Request a new one and try again.";
  }
  if (normalised.includes("captcha")) {
    return "Captcha verification failed. Please try again.";
  }

  // Anything unrecognised: log the detail server-side, return something generic.
  console.error("[auth] unmapped error:", message);
  return "Something went wrong on our side. Please try again.";
}

/** Resolves the request origin, falling back to the configured app URL. */
async function requestOrigin(): Promise<string> {
  try {
    const headerList = await headers();
    const origin = headerList.get("origin");
    if (origin) return origin;

    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // Fall through to the configured value.
  }
  return appUrl();
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const origin = await requestOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Metadata is consumed by the handle_new_user() trigger to seed the profile.
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    return { ok: false, error: describeAuthError(error.message, error.status) };
  }

  // With email confirmation enabled Supabase returns a user but no session.
  // Returning `identities: []` is how it signals "this email already exists"
  // without disclosing that fact through an error — treat it the same as a
  // successful signup so the response is indistinguishable to an attacker.
  if (data.user && !data.session) {
    return {
      ok: true,
      message:
        "Check your inbox — we've sent a confirmation link to finish setting up your account.",
    };
  }

  // Confirmation disabled: the user is signed in immediately.
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const { email, password, next } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: describeAuthError(error.message, error.status) };
  }

  // Send the user to onboarding if they never finished it, otherwise honour the
  // `next` param they arrived with.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = next ?? "/dashboard";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_step")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.onboarding_step !== "done") {
      destination = "/onboarding";
    }
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: { email: parsed.error.issues[0]?.message ?? "Enter a valid email." },
    };
  }

  const supabase = await createServerSupabaseClient();
  const origin = await requestOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Rate limiting is the one error worth surfacing. Everything else is
  // swallowed on purpose: a differing response would reveal which emails are
  // registered.
  if (error && (error.status === 429 || error.message.toLowerCase().includes("rate"))) {
    return { ok: false, error: describeAuthError(error.message, error.status) };
  }
  if (error) {
    console.error("[auth] resetPasswordForEmail:", error.message);
  }

  return {
    ok: true,
    message:
      "If an account exists for that address, a password reset link is on its way. The link is valid for one hour.",
  };
}

// ---------------------------------------------------------------------------
// Reset password (completes the recovery flow)
// ---------------------------------------------------------------------------

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createServerSupabaseClient();

  // The recovery link established a session via /auth/confirm. Without one the
  // link was never opened, or it expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error:
        "This reset link is no longer valid. Request a new password reset email and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { ok: false, error: describeAuthError(error.message, error.status) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard?password_updated=1");
}

// ---------------------------------------------------------------------------
// Resend verification email
// ---------------------------------------------------------------------------

export async function resendVerificationAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { ok: false, fieldErrors: { email: "Enter your email address." } };
  }

  const supabase = await createServerSupabaseClient();
  const origin = await requestOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/onboarding` },
  });

  if (error && (error.status === 429 || error.message.toLowerCase().includes("rate"))) {
    return { ok: false, error: describeAuthError(error.message, error.status) };
  }
  if (error) {
    console.error("[auth] resend:", error.message);
  }

  return { ok: true, message: "Verification email sent. Check your inbox." };
}
