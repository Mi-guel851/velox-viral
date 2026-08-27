"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { forgotPasswordAction, type AuthActionResult } from "@/lib/auth/actions";
import { FormField } from "@/components/auth/FormField";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";

/**
 * Password reset request.
 *
 * The success response is identical whether or not the address is registered,
 * so this screen cannot be used to enumerate accounts.
 */
export const ForgotPasswordForm: React.FC<{ configured: boolean }> = ({ configured }) => {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await forgotPasswordAction(formData);
      setResult(response);
    });
  }

  if (result?.ok) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
          <MailCheck className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset link sent</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">{result.message}</p>
        </div>

        <Button
          asChild
          variant="apple"
          className="w-full h-11 rounded-2xl text-sm font-semibold"
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
        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
        <p className="text-sm text-zinc-400">
          Enter the email on your account and we&apos;ll send a reset link.
        </p>
      </header>

      {!configured && (
        <AuthAlert variant="info">
          Password reset needs a connected database. Add your Supabase credentials
          to enable it.
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

        <Button
          type="submit"
          variant="gradient"
          disabled={isPending || !configured}
          className="w-full h-12 rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Sending reset link…</span>
            </>
          ) : (
            <span>Send reset link</span>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
};
