import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Subtle warm glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Velox Viral home"
          >
            <Logo size="md" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to site</span>
          </Link>
        </div>

        <main className="surface-elevated rounded-2xl border border-white/[0.06] p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
