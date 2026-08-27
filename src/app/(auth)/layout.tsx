import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

/**
 * Shell for every unauthenticated auth screen.
 *
 * Route protection lives in middleware; this layout is presentation only, so a
 * signed-in user hitting /login is redirected before this ever renders.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Velox Viral home"
          >
            <Logo size="md" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to site</span>
          </Link>
        </div>

        <main className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
          {children}
        </main>
      </div>
    </div>
  );
}
