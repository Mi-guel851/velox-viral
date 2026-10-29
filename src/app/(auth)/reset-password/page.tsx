import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

function ResetFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100/80" />
        <div className="h-7 w-52 rounded-lg bg-slate-100/80" />
        <div className="h-4 w-64 rounded bg-slate-100/80" />
      </div>
      <div className="space-y-4">
        <div className="h-[70px] rounded-xl bg-slate-100/80" />
        <div className="h-[70px] rounded-xl bg-slate-100/80" />
        <div className="h-12 rounded-xl bg-slate-100/80" />
      </div>
    </div>
  );
}

/**
 * The security-phrase recovery flow lands here with ?token=... in the URL.
 * The legacy email recovery flow lands here after /auth/confirm creates a session.
 * Wrapping in Suspense is required because the form uses useSearchParams().
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm hasRecoverySession={Boolean(user)} />
    </Suspense>
  );
}
