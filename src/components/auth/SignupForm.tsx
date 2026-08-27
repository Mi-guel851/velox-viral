"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, MailCheck, Sparkles } from "lucide-react";
import { signUpAction, resendVerificationAction, type AuthActionResult } from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Signup form.
 *
 * On success with email confirmation enabled the form swaps to a "check your
 * inbox" state with a working resend action, rather than pretending the account
 * is ready to use.
 */
export const SignupForm: React.FC<{ configured: boolean }> = ({ configured }) => {
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmittedEmail(String(formData.get("email") ?? ""));

    startTransition(async () => {
      // On immediate sign-in this redirects and never resolves.
      const response = await signUpAction(formData);
      setResult(response);
    });
  }

  function handleResend() {
    startResend(async () => {
      const formData = new FormData();
      formData.set("email", submittedEmail);
      const response = await resendVerificationAction(formData);
      if (response.ok) {
        toast.success(response.message ?? "Verification email sent.");
      } else {
        toast.error(response.error ?? "Could not resend the email.");
      }
    });
  }

  // ---- Post-signup: awaiting email verification --------------------------
  if (result?.ok && result.message) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
          <MailCheck className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Check your inbox</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">{result.message}</p>
          {submittedEmail && (
            <p className="text-xs text-zinc-500 font-mono pt-1">{submittedEmail}</p>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          <Button
            type="button"
            variant="apple"
            onClick={handleResend}
            disabled={isResending || !submittedEmail}
            className="w-full h-11 rounded-2xl text-sm font-semibold"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Sending…</span>
              </>
            ) : (
              <span>Resend verification email</span>
            )}
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full h-11 rounded-2xl text-sm text-zinc-400 hover:text-white"
          >
            <Link href="/login">Back to log in</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ---- Signup form -------------------------------------------------------
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create your workspace
        </h1>
        <p className="text-sm text-zinc-400">
          Free to start. No card required.
        </p>
      </header>

      {!configured && (
        <AuthAlert variant="info">
          This deployment has no database connected yet. Add your Supabase
          credentials to enable account creation.
        </AuthAlert>
      )}

      {result?.error && <AuthAlert variant="error">{result.error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Alex Rivera"
          required
          disabled={isPending || !configured}
          error={result?.fieldErrors?.fullName}
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isPending || !configured}
          error={result?.fieldErrors?.email}
        />

        <div>
          <FormField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Choose a strong password"
            required
            disabled={isPending || !configured}
            error={result?.fieldErrors?.password}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <PasswordStrength value={password} />
        </div>

        <Button
          type="submit"
          variant="gradient"
          disabled={isPending || !configured}
          className="w-full h-12 rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Creating your workspace…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Create free account</span>
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
};
