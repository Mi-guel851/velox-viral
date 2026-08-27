"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { resetPasswordAction, type AuthActionResult } from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";

interface ResetPasswordFormProps {
  /**
   * Whether the recovery link produced a valid session. False means the user
   * navigated here directly or the link expired, so there is nothing to reset.
   */
  hasRecoverySession: boolean;
}

/** Completes the recovery flow by setting a new password. */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  hasRecoverySession,
}) => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      // Success redirects to the dashboard, so this only resolves on failure.
      const response = await resetPasswordAction(formData);
      setResult(response);
    });
  }

  if (!hasRecoverySession) {
    return (
      <div className="space-y-6">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            This link isn&apos;t valid
          </h1>
        </header>

        <AuthAlert variant="error">
          Password reset links expire after one hour and can only be used once.
          Request a fresh link to continue.
        </AuthAlert>

        <div className="space-y-2.5">
          <Button
            asChild
            variant="gradient"
            className="w-full h-11 rounded-2xl text-sm font-semibold"
          >
            <Link href="/forgot-password">Request a new link</Link>
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

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-zinc-400">
          You&apos;ll be signed in once it&apos;s saved.
        </p>
      </header>

      {result?.error && <AuthAlert variant="error">{result.error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <FormField
            label="New password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Choose a strong password"
            required
            disabled={isPending}
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

        <FormField
          label="Confirm new password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          disabled={isPending}
          error={result?.fieldErrors?.confirmPassword}
        />

        <Button
          type="submit"
          variant="gradient"
          disabled={isPending}
          className="w-full h-12 rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Saving your password…</span>
            </>
          ) : (
            <span>Save new password</span>
          )}
        </Button>
      </form>
    </div>
  );
};
