"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { verifySecurityPhraseAction, type AuthActionResult } from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ForgotPasswordForm: React.FC<{ configured: boolean }> = ({ configured }) => {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [securityPhrase, setSecurityPhrase] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      // On success this redirects to /reset-password?token=..., so this only
      // resolves on failure or the informational success message.
      const response = await verifySecurityPhraseAction(formData);
      setResult(response);
    });
  }

  if (result?.ok && result.message) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-600 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Check your result
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">{result.message}</p>
        </div>

        <Button
          asChild
          variant="apple"
          className="w-full h-11 rounded-xl text-sm font-semibold"
        >
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  const error = result?.error ?? linkError ?? undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-600 mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
          Recover your account
        </h1>
        <p className="text-sm text-slate-500">
          Enter your email and the security phrase you set during signup.
        </p>
      </header>

      {!configured && (
        <AuthAlert variant="info">
          Account recovery needs a connected database. Add your Supabase
          credentials to enable it.
        </AuthAlert>
      )}

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          <label
            htmlFor="security-phrase"
            className="block text-xs font-semibold text-slate-600 tracking-wide"
          >
            Security phrase
          </label>
          <input
            id="security-phrase"
            name="securityPhrase"
            type="text"
            value={securityPhrase}
            onChange={(e) => {
              setSecurityPhrase(e.target.value);
              if (result?.error) setResult(null);
            }}
            placeholder="Enter the phrase you set during signup"
            required
            disabled={isPending || !configured}
            className={cn(
              "w-full rounded-xl bg-slate-100/80 border px-4 py-3 text-sm text-slate-800",
              "placeholder:text-slate-400 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "border-slate-200"
            )}
          />
          {result?.fieldErrors?.securityPhrase && (
            <p className="text-[11px] font-medium text-rose-600">
              {result.fieldErrors.securityPhrase}
            </p>
          )}
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
              <span>Verifying…</span>
            </>
          ) : (
            <span>Verify and reset password</span>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
};
