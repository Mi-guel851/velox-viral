import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CalendarClock,
  BarChart3,
  Repeat2,
  Eye,
  ShieldCheck,
  Bell,
  Check,
  Zap,
  PenTool,
  Link2,
  Rocket,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/marketing/Reveal";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { FlywheelVisual } from "@/components/marketing/FlywheelVisual";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import {
  PLANS,
  PLAN_ORDER,
  formatPlanPrice,
  planAmount,
  DEFAULT_BILLING_CURRENCY,
} from "@/lib/plans";
import { serverEnv } from "@/lib/env.server";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${BRAND.name} — Write once. Publish everywhere.`,
  description: BRAND.description,
};

const FEATURES = [
  {
    icon: PenTool,
    title: "One composer, seven channels",
    body:
      "Write a master draft and override any platform individually. Character limits, hashtag caps and media rules are validated per platform before anything is sent.",
    color: "amber",
  },
  {
    icon: Eye,
    title: "Pixel-accurate previews",
    body:
      "See exactly how a post renders on each network — phone, tablet and desktop, light and dark — before it goes out.",
    color: "zinc",
  },
  {
    icon: Repeat2,
    title: "1-to-7 repurposing",
    body:
      "Paste an article, transcript or set of notes. Get a native format for every channel: a thread, a carousel caption, a short-form script, a discussion prompt.",
    color: "amber",
  },
  {
    icon: CalendarClock,
    title: "Server-side scheduling",
    body:
      "Queue a post and close your laptop. Publishing happens on our servers with retries and per-platform status.",
    color: "zinc",
  },
  {
    icon: BarChart3,
    title: "Real analytics, not estimates",
    body:
      "Impressions, reach, saves, clicks and follower growth pulled straight from each platform's API. Never estimated.",
    color: "amber",
  },
  {
    icon: Bell,
    title: "Backend-confirmed events",
    body:
      "Notifications fire on real events: published, partially published, failed, token expiring. A success means the platform confirmed it.",
    color: "zinc",
  },
];

const STEPS = [
  {
    number: "01",
    icon: Link2,
    title: "Connect your channels",
    body:
      "Authorise each network over OAuth. Tokens are encrypted before they touch the database and never exposed to the browser.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Compose and adapt",
    body:
      "Draft once, then let the AI studio generate hooks, captions and hashtags tuned to the platform you're targeting.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Publish or queue",
    body:
      "Send immediately or schedule it. Track each platform's result independently and retry only what failed.",
  },
];

const FAQS = [
  {
    q: "Do I need developer accounts for each social network?",
    a: "To publish, yes — every network requires its own app credentials, and that is a platform rule rather than ours. Velox Viral ships the full integration for each one; you add the credentials in your environment and the channel activates immediately.",
  },
  {
    q: "Where do the analytics numbers come from?",
    a: "Each platform's own insights API. We collect, normalise and store them so trends survive across platforms and time. Before you connect an account there is nothing to show, and the dashboard says so.",
  },
  {
    q: "What happens if a scheduled post fails on one platform?",
    a: "Each platform is tracked as a separate target with its own status, error and retry count. If X succeeds and Instagram rejects the caption, the post is marked partially published, you're notified, and you can retry just that channel.",
  },
  {
    q: "How do I recover my account if I forget my password?",
    a: "During signup you set a security phrase — something personal you'll remember. If you forget your password, enter your email and that phrase to verify your identity and set a new one. No email link required.",
  },
  {
    q: "How are my access tokens stored?",
    a: "Encrypted with AES-256-GCM in the application layer, held in a table that no browser session can read, and used only by server-side publishing code. The encryption key lives in your environment, never in the database.",
  },
  {
    q: "Can I cancel or change plan?",
    a: "Any time. Plan limits are enforced server-side, so changes take effect straight away and your existing drafts and history are never touched.",
  },
];

export default function LandingPage() {
  const currency = serverEnv.PAYSTACK_CURRENCY ?? DEFAULT_BILLING_CURRENCY;

  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-36 sm:pt-44 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Subtle radial glow — warm, not neon */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/[0.06] via-transparent to-transparent blur-3xl pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400/90 border border-amber-500/15">
                <Sparkles className="w-3.5 h-3.5" />
                AI social operating system
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white tracking-[-0.02em] leading-[1.08]">
                Write once.
                <br />
                <span className="text-amber-400">
                  Publish everywhere.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-lg">
                {BRAND.name} turns a single draft into platform-native posts for seven
                networks, schedules them server-side, and reports what genuinely
                published — per channel, with real numbers.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  asChild
                  variant="gradient"
                  size="lg"
                  className="h-12 px-7 rounded-xl text-sm font-semibold"
                >
                  <Link href="/signup">
                    <span>Create free account</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="apple"
                  size="lg"
                  className="h-12 px-7 rounded-xl text-sm"
                >
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-500/80" />
                  Free plan, no card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500/80" />
                  Encrypted tokens, row-level isolation
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} y={26}>
            <FlywheelVisual />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Platforms — horizontal scroll on mobile, grid on desktop             */}
      {/* ------------------------------------------------------------------ */}
      <section id="platforms" className="py-16 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.25em] mb-10">
              One draft. Seven native formats.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0 sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible">
              {ALL_PLATFORMS.map((platform) => {
                const config = PLATFORMS[platform];
                return (
                  <div
                    key={platform}
                    className="surface-card rounded-xl px-4 py-3.5 flex items-center gap-3 min-w-[140px] sm:min-w-0 sm:flex-col sm:items-center sm:gap-2 sm:text-center sm:px-3"
                  >
                    <PlatformIcon platform={platform} className="w-5 h-5 text-zinc-300 shrink-0" />
                    <div className="sm:space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-200 leading-tight block">
                        {config.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600 block">
                        {config.maxCharacters.toLocaleString("en-US")} chars
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features — two-column editorial layout, not a card grid             */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-24 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-16">
              <span className="text-[11px] font-semibold text-amber-500/80 uppercase tracking-[0.25em] mb-4 block">
                Features
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
                Everything real.
                <br />
                Nothing simulated.
              </h2>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-lg">
                Every number comes from a platform API, every publish is confirmed by
                the network before we call it published.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.05}>
                <div className="bg-[#0b0d13] p-7 sm:p-8 space-y-4 group hover:bg-white/[0.015] transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        feature.color === "amber"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-white/[0.04] text-zinc-400"
                      )}
                    >
                      <feature.icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-display text-[15px] font-semibold text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works — numbered steps with connecting line                  */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-[11px] font-semibold text-amber-500/80 uppercase tracking-[0.25em] mb-4 block">
                How it works
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
                Three steps to a running channel
              </h2>
            </div>
          </Reveal>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-[52px] left-[16.7%] right-[16.7%] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.1}>
                <div className="relative text-center space-y-5">
                  <div className="relative inline-flex">
                    <div className="w-[52px] h-[52px] rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-amber-400/80" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="py-24 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-[11px] font-semibold text-amber-500/80 uppercase tracking-[0.25em] mb-4 block">
                Pricing
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
                Start free. Upgrade when you outgrow it.
              </h2>
              <p className="mt-3 text-sm text-zinc-400">
                Limits are enforced on the server, so what a plan says is what a plan does.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {PLAN_ORDER.map((planId, index) => {
              const plan = PLANS[planId];
              const isPaid = planAmount(plan, currency) > 0;
              return (
                <Reveal key={plan.id} delay={index * 0.08}>
                  <div
                    className={cn(
                      "relative rounded-2xl p-6 h-full flex flex-col space-y-5 transition-all duration-300",
                      plan.highlighted
                        ? "bg-amber-500/[0.06] border border-amber-500/20 shadow-lg shadow-amber-500/5"
                        : "surface-card"
                    )}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                        POPULAR
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-3xl font-bold text-white tracking-tight">
                          {formatPlanPrice(plan, currency)}
                        </span>
                        {isPaid && (
                          <span className="text-xs text-zinc-500 font-medium">/month</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {plan.tagline}
                      </p>
                    </div>

                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 shrink-0" />
                          <span className="text-xs text-zinc-300 leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant={plan.highlighted ? "gradient" : "apple"}
                      className="w-full rounded-xl h-11 text-sm font-semibold"
                    >
                      <Link href="/signup">
                        {isPaid ? `Choose ${plan.name}` : "Get started free"}
                      </Link>
                    </Button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ — native <details> so this section needs no JavaScript          */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="py-24 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-[11px] font-semibold text-amber-500/80 uppercase tracking-[0.25em] mb-4 block">
                FAQ
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
                Straight answers
              </h2>
            </div>
          </Reveal>

          <div className="space-y-2">
            {FAQS.map((faq, index) => (
              <Reveal key={faq.q} delay={index * 0.04}>
                <details className="group surface-card rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl">
                    <span className="text-sm font-semibold text-zinc-200">{faq.q}</span>
                    <span
                      aria-hidden
                      className="shrink-0 w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 transition-transform duration-200 group-open:rotate-45"
                    >
                      <span className="text-base leading-none">+</span>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Closing CTA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 sm:px-6">
        <Reveal>
          <div className="relative max-w-4xl mx-auto rounded-2xl border border-white/[0.06] p-8 sm:p-14 text-center overflow-hidden">
            {/* Warm ambient glow */}
            <div
              aria-hidden
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-b from-amber-500/[0.08] via-transparent to-transparent blur-3xl pointer-events-none"
            />
            <div className="relative space-y-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 mx-auto">
                <Zap className="w-6 h-6 fill-zinc-950" />
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
                Stop rewriting the same post
                <br className="hidden sm:block" />
                {" "}seven times
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                Create an account, connect a channel, and publish your first
                cross-platform post in a few minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                <Button
                  asChild
                  variant="gradient"
                  size="lg"
                  className="h-12 px-8 rounded-xl text-sm font-semibold"
                >
                  <Link href="/signup">
                    <span>Create free account</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="apple"
                  size="lg"
                  className="h-12 px-8 rounded-xl text-sm"
                >
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-white/[0.04] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Logo size="sm" withTagline />

          <nav className="flex items-center gap-5 text-xs text-zinc-500">
            <a href="#features" className="hover:text-zinc-300 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-zinc-300 transition-colors">
              Pricing
            </a>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-zinc-300 transition-colors">
              Sign up
            </Link>
          </nav>

          <span className="text-[11px] text-zinc-600">
            © {new Date().getFullYear()} {BRAND.name}
          </span>
        </div>
      </footer>
    </div>
  );
}
