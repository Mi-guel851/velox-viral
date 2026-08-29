"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#platforms", label: "Platforms" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export const MarketingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <nav
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl px-4 sm:px-5 py-2.5 transition-all duration-300",
              scrolled
                ? "surface-elevated shadow-lg"
                : "border border-transparent"
            )}
          >
            <Link
              href="/"
              className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Velox Viral home"
            >
              <Logo size="sm" />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex h-9 px-3.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-lg"
              >
                <Link href="/login">Log in</Link>
              </Button>

              <Button
                asChild
                variant="gradient"
                size="sm"
                className="h-9 px-4 rounded-lg text-xs font-semibold"
              >
                <Link href="/signup">
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile sheet */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-xl pt-24 px-4">
          <div className="surface-elevated rounded-2xl p-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/[0.06] mt-2 space-y-2">
              <Button
                asChild
                variant="apple"
                className="w-full rounded-xl h-11 text-sm font-semibold"
              >
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button
                asChild
                variant="gradient"
                className="w-full rounded-xl h-11 text-sm font-semibold"
              >
                <Link href="/signup" onClick={() => setMenuOpen(false)}>
                  Create free account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
