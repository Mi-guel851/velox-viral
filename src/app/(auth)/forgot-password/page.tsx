import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-7 w-52 rounded-lg bg-white/[0.06]" />
          <div className="h-[70px] rounded-2xl bg-white/[0.04]" />
          <div className="h-12 rounded-2xl bg-white/[0.06]" />
        </div>
      }
    >
      <ForgotPasswordForm configured={isSupabaseConfigured()} />
    </Suspense>
  );
}
