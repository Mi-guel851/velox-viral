"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { signUpAction, type AuthActionResult } from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";

export const SignupForm: React.FC<{ configured: boolean }> = ({ configured }) => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      // On success this redirects to /onboarding, so this only resolves on failure.
      const response = await signUpAction(formData);
      setResult(response);
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
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
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
          className="w-full h-12 rounded-xl text-sm font-semibold"
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
          className="font-semibold text-amber-500 hover:text-amber-400 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
};
