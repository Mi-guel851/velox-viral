import React from "react";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { getCurrentUser } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Set up your account",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if onboarding is already complete.
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_step, security_phrase")
    .eq("id", user.id)
    .maybeSingle();

  // If onboarding is done and security phrase is set, go to dashboard.
  if (profile?.onboarding_step === "done" && profile?.security_phrase) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Subtle warm glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Logo size="md" />
        </div>

        <div className="surface-elevated rounded-2xl border border-white/[0.06] p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                One last thing
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Set a <span className="text-zinc-200 font-medium">security phrase</span> you&apos;ll
                remember. You&apos;ll use this to recover your account if you ever
                forget your password.
              </p>
            </div>

            <OnboardingForm />
          </div>
        </div>
      </div>
    </div>
  );
}
