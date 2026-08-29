"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import {
  resetPasswordAction,
  resetPasswordWithTokenAction,
  type AuthActionResult,
} from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";

interface ResetPasswordFormProps {
  hasRecoverySession: boolean;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  hasRecoverySession,
}) => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Add the token if present.
    if (token) {
      formData.set("token", token);
    }

    startTransition(async () => {
      // Choose the right action based on whether we have a token or a recovery session.
      const action = token ? resetPasswordWithTokenAction : resetPasswordAction;
      const response = await action(formData);
      setResult(response);
    });
  }

  // No recovery session and no token — this is an invalid/expired link.
  if (!hasRecoverySession && !token) {
    return (
      <div className="space-y-6">
        <header className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            This link isn&apos;t valid
          </h1>
        </header>

        <AuthAlert variant="error">
          Password reset links expire after one hour and can only be used once.
          Use your security phrase to recover your account instead.
        </AuthAlert>

        <div className="space-y-2.5">
          <Button
            asChild
            variant="gradient"
            className="w-full h-11 rounded-xl text-sm font-semibold"
          >
            <Link href="/forgot-password">Recover with security phrase</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="w-full h-11 rounded-xl text-sm text-zinc-400 hover:text-zinc-100"
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
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-zinc-400">
          You&apos;ll be signed in once it&apos;s saved.
        </p>
      </header>

      {result?.error && <AuthAlert variant="error">{result.error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {token && <input type="hidden" name="token" value={token} />}

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
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
          className="w-full h-12 rounded-xl text-sm font-semibold"
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
