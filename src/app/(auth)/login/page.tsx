import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Velox Viral workspace.",
  robots: { index: false, follow: false },
};

/** Skeleton shown while the client form hydrates and reads search params. */
function LoginFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-64 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-4">
        <div className="h-[70px] rounded-2xl bg-white/[0.04]" />
        <div className="h-[70px] rounded-2xl bg-white/[0.04]" />
        <div className="h-12 rounded-2xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    // useSearchParams requires a Suspense boundary to keep this route static.
    <Suspense fallback={<LoginFallback />}>
      <LoginForm configured={isSupabaseConfigured()} />
    </Suspense>
  );
}
