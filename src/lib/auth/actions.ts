"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  signUpSchema,
  signInSchema,
  securityPhraseSchema,
  verifySecurityPhraseSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
}

const NOT_CONFIGURED: AuthActionResult = {
  ok: false,
  error:
    "This deployment is not connected to a database yet. Add your Supabase credentials to enable accounts.",
};

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

  console.error("[auth] unmapped error:", message);
  return "Something went wrong on our side. Please try again.";
}

// ---------------------------------------------------------------------------
// Sign up — no email confirmation, user is signed in immediately
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // No emailRedirectTo — confirmation is disabled, user is signed in immediately.
    },
  });

  if (error) {
    return { ok: false, error: describeAuthError(error.message, error.status) };
  }

  // User is signed in immediately (confirmation disabled). Redirect to onboarding.
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

    // If the user hasn't set up their security phrase yet, send them to onboarding.
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
// Save security phrase (onboarding step)
// ---------------------------------------------------------------------------

export async function saveSecurityPhraseAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = securityPhraseSchema.safeParse({
    securityPhrase: formData.get("securityPhrase"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: {
        securityPhrase: parsed.error.issues[0]?.message ?? "Enter a security phrase.",
      },
    };
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to do this." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      security_phrase: parsed.data.securityPhrase,
      onboarding_step: "done",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[auth] saveSecurityPhrase:", error.message);
    return { ok: false, error: "Could not save your security phrase. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Forgot password — verify security phrase instead of email link
// ---------------------------------------------------------------------------

export async function verifySecurityPhraseAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = verifySecurityPhraseSchema.safeParse({
    email: formData.get("email"),
    securityPhrase: formData.get("securityPhrase"),
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

  const { email, securityPhrase } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Look up the user by email from the profiles table.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, security_phrase")
    .eq("email", email)
    .maybeSingle();

  // Don't reveal whether the email exists — return the same message either way.
  if (!profile?.security_phrase || profile.security_phrase !== securityPhrase) {
    return {
      ok: true,
      message:
        "If an account exists with that email and the security phrase matches, you'll be able to set a new password.",
    };
  }

  const userId = profile.id;

  // Security phrase matches. Create a temporary reset token and redirect.
  const crypto = await import("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Store the reset token hash in activity_logs.
  const { error: logError } = await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "password_reset_request",
    entity_type: "auth",
    entity_id: resetTokenHash,
    metadata: { expires_at: expiresAt },
  });

  if (logError) {
    console.error("[auth] log reset token:", logError.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Redirect to the reset password page with the token.
  revalidatePath("/", "layout");
  redirect(`/reset-password?token=${resetToken}`);
}

// ---------------------------------------------------------------------------
// Reset password via security-phrase flow (not email link)
// ---------------------------------------------------------------------------

export async function resetPasswordWithTokenAction(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const token = formData.get("token") as string;
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

  if (!token) {
    return { ok: false, error: "Invalid reset link. Please start over." };
  }

  const crypto = await import("crypto");
  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const supabase = await createServerSupabaseClient();

  // Look up the reset token in activity_logs.
  const { data: logEntry, error: logError } = await supabase
    .from("activity_logs")
    .select("user_id, metadata")
    .eq("action", "password_reset_request")
    .eq("entity_type", "auth")
    .eq("entity_id", resetTokenHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (logError || !logEntry) {
    return { ok: false, error: "This reset link is invalid. Please start over." };
  }

  // Check expiry.
  const expiresAt = (logEntry.metadata as Record<string, string>)?.expires_at;
  if (!expiresAt || new Date(expiresAt) < new Date()) {
    return { ok: false, error: "This reset link has expired. Start the recovery process again." };
  }

  // Use the admin client to update the user's password (we have the user_id from the log).
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();

  if (!admin) {
    return { ok: false, error: "Admin client not configured." };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(logEntry.user_id, {
    password: parsed.data.password,
  });

  if (updateError) {
    return { ok: false, error: describeAuthError(updateError.message, updateError.status) };
  }

  // Delete the used reset token.
  await supabase
    .from("activity_logs")
    .delete()
    .eq("action", "password_reset_request")
    .eq("entity_type", "auth")
    .eq("entity_id", resetTokenHash);

  revalidatePath("/", "layout");
  redirect("/login?password_updated=1");
}

// ---------------------------------------------------------------------------
// Legacy: forgot password (kept for backwards compat, now redirects to security phrase flow)
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  // This action is now handled by verifySecurityPhraseAction.
  // Redirect callers to the new flow.
  return {
    ok: false,
    error: "Please use the security phrase recovery form instead.",
  };
}

// ---------------------------------------------------------------------------
// Legacy: reset password via email link (kept for backwards compat)
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "This reset link is no longer valid. Use your security phrase to recover your account.",
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
// Resend verification email (legacy, kept for backwards compat)
// ---------------------------------------------------------------------------

export async function resendVerificationAction(formData: FormData): Promise<AuthActionResult> {
  // Email confirmation is disabled. This is a no-op.
  return {
    ok: true,
    message: "Email confirmation is not required for this account.",
  };
}
