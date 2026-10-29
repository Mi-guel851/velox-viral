import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Recover your account",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-7 w-52 rounded-lg bg-slate-100/80" />
          <div className="h-[70px] rounded-2xl bg-slate-100/80" />
          <div className="h-12 rounded-2xl bg-slate-100/80" />
        </div>
      }
    >
      <ForgotPasswordForm configured={isSupabaseConfigured()} />
    </Suspense>
  );
}
