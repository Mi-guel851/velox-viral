"use client";

import React, { useState, useTransition } from "react";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { saveSecurityPhraseAction, type AuthActionResult } from "@/lib/auth/actions";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXAMPLE_PHRASES = [
  "My first car was a blue Civic",
  "The golden retriever by the lake",
  "Mom's apple pie recipe secret",
  "Summer of 2019 in Barcelona",
  "The lamp post on Elm Street",
];

export const OnboardingForm: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [phrase, setPhrase] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("securityPhrase", phrase);
    formData.set("workspaceName", workspaceName);

    startTransition(async () => {
      // On success this redirects to /dashboard, so this only resolves on failure.
      const response = await saveSecurityPhraseAction(formData);
      setResult(response);
    });
  }

  function useExample(example: string) {
    setPhrase(example);
    setResult(null);
  }

  if (submitted && !result?.error) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-sm text-zinc-300 font-medium">Security phrase saved!</p>
        <p className="text-xs text-zinc-500">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {result?.error && <AuthAlert variant="error">{result.error}</AuthAlert>}

      <div className="space-y-2">
        <label
          htmlFor="workspace-name"
          className="block text-xs font-semibold text-zinc-300 tracking-wide"
        >
          Workspace name
        </label>
        <input
          id="workspace-name"
          type="text"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="e.g. My Creator Studio"
          required
          minLength={2}
          maxLength={60}
          disabled={isPending}
          className={cn(
            "w-full rounded-xl bg-white/[0.03] border px-4 py-3 text-sm text-zinc-100",
            "placeholder:text-zinc-600 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "border-white/[0.06]"
          )}
        />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          This is your workspace display name shown across the app.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="security-phrase"
          className="block text-xs font-semibold text-zinc-300 tracking-wide"
        >
          Security phrase
        </label>
        <input
          id="security-phrase"
          type="text"
          value={phrase}
          onChange={(e) => {
            setPhrase(e.target.value);
            setResult(null);
          }}
          placeholder="e.g. My first car was a blue Civic"
          required
          minLength={3}
          maxLength={120}
          disabled={isPending}
          className={cn(
            "w-full rounded-xl bg-white/[0.03] border px-4 py-3 text-sm text-zinc-100",
            "placeholder:text-zinc-600 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "border-white/[0.06]"
          )}
        />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Pick something personal to you that you won&apos;t forget. This replaces
          email-based password recovery.
        </p>
      </div>

      {/* Example phrases */}
      <div className="space-y-2">
        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
          Need inspiration?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PHRASES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => useExample(example)}
              disabled={isPending}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] transition-colors",
                phrase === example
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "bg-white/[0.03] text-zinc-500 border border-white/[0.04] hover:bg-white/[0.06] hover:text-zinc-300"
              )}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="gradient"
        disabled={isPending || phrase.trim().length < 3 || workspaceName.trim().length < 2}
        className="w-full h-12 rounded-xl text-sm font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Saving…</span>
          </>
        ) : (
          <>
            <span>Continue to dashboard</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
};
