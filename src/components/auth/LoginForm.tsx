"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { signInAction, type AuthActionResult } from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";

export const LoginForm: React.FC<{ configured: boolean }> = ({ configured }) => {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "";
  const linkError = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await signInAction(formData);
      setResult(response);
    });
  }

  const error = result?.error ?? linkError ?? undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-zinc-400">
          Log in to manage your channels and publishing queue.
        </p>
      </header>

      {!configured && (
        <AuthAlert variant="info">
          This deployment has no database connected yet. Add{" "}
          <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
          enable accounts.
        </AuthAlert>
      )}

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={nextParam} />

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

        <div className="space-y-1.5">
          <FormField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            required
            disabled={isPending || !configured}
            error={result?.fieldErrors?.password}
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

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-amber-500/80 hover:text-amber-400 transition-colors rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Forgot your password?
            </Link>
          </div>
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
              <span>Signing you in…</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              <span>Log in</span>
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        New to Velox Viral?{" "}
        <Link
          href="/signup"
          className="font-semibold text-amber-500 hover:text-amber-400 transition-colors"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
};
