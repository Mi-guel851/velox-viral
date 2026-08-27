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
import { PLANS, PLAN_ORDER, formatPlanPrice } from "@/lib/plans";
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
    accent: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Eye,
    title: "Pixel-accurate previews",
    body:
      "See exactly how a post renders on each network — phone, tablet and desktop, light and dark — before it goes out. No more publishing then checking.",
    accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Repeat2,
    title: "1-to-7 repurposing",
    body:
      "Paste an article, transcript or set of notes. Get a native format for every channel: a thread, a carousel caption, a short-form script, a discussion prompt.",
    accent: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: CalendarClock,
    title: "Scheduling that runs server-side",
    body:
      "Queue a post and close your laptop. Publishing happens on our servers with retries and per-platform status, so nothing depends on a browser tab staying open.",
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: BarChart3,
    title: "Analytics pulled from the source",
    body:
      "Impressions, reach, saves, clicks and follower growth read straight from each platform's API and normalised into one model. Empty until you connect an account — never estimated.",
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Bell,
    title: "Told when it actually happens",
    body:
      "Notifications fire on real backend events: published, partially published, failed, token expiring. A success message means the platform confirmed it.",
    accent: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
];

const STEPS = [
  {
    icon: Link2,
    title: "Connect your channels",
    body:
      "Authorise each network over OAuth. Tokens are encrypted before they touch the database and are never exposed to the browser.",
  },
  {
    icon: Sparkles,
    title: "Compose and adapt",
    body:
      "Draft once, then let the AI studio generate hooks, captions and hashtags tuned to the platform you're targeting.",
  },
  {
    icon: Rocket,
    title: "Publish or queue",
    body:
      "Send immediately or schedule it. Track each platform's result independently and retry only what failed.",
  },
];

const FAQS = [
  {
    q: "Do I need developer accounts for each social network?",
    a: "To publish, yes — every network requires its own app credentials, and that is a platform rule rather than ours. Velox Viral ships the full integration for each one; you add the credentials in your environment and the channel activates immediately. Any channel you haven't configured tells you exactly which variables it needs instead of pretending to be connected.",
  },
  {
    q: "Where do the analytics numbers come from?",
    a: "Each platform's own insights API. We collect, normalise and store them so trends survive across platforms and time. Before you connect an account there is nothing to show, and the dashboard says so rather than displaying a placeholder figure.",
  },
  {
    q: "What happens if a scheduled post fails on one platform?",
    a: "Each platform is tracked as a separate target with its own status, error and retry count. If X succeeds and Instagram rejects the caption, the post is marked partially published, you're notified about the specific failure, and you can retry just that channel.",
  },
  {
    q: "How are my access tokens stored?",
    a: "Encrypted with AES-256-GCM in the application layer, held in a table that no browser session can read under any circumstances, and used only by server-side publishing code. The encryption key lives in your environment, never in the database.",
  },
  {
    q: "Can I cancel or change plan?",
    a: "Any time. Plan limits are enforced server-side, so changes take effect straight away and your existing drafts and history are never touched.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                <Sparkles className="w-3.5 h-3.5" />
                AI social operating system
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
                Write once.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Publish everywhere.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
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
                  className="h-13 px-7 rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-500/25"
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
                  className="h-13 px-7 rounded-2xl text-sm font-semibold"
                >
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Free plan, no card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
      {/* Platforms                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section id="platforms" className="py-14 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-8">
              One draft. Seven native formats.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {ALL_PLATFORMS.map((platform) => {
                const config = PLATFORMS[platform];
                return (
                  <div
                    key={platform}
                    className="glass-card rounded-2xl p-4 border border-white/[0.07] flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <PlatformIcon platform={platform} className="w-6 h-6 text-zinc-200" />
                    <span className="text-[11px] font-semibold text-zinc-300 leading-tight">
                      {config.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {config.maxCharacters.toLocaleString("en-US")} chars
                    </span>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-20 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-12">
          <Reveal>
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.2em]">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Everything real. Nothing simulated.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Every number comes from a platform API, every publish is confirmed by
                the network before we call it published, and every button either does
                something or tells you what it needs.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.06}>
                <div className="glass-card rounded-3xl p-6 border border-white/10 h-full space-y-3.5">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center border",
                      feature.accent
                    )}
                  >
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{feature.title}</h3>
                  <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <Reveal>
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-[0.2em]">
                How it works
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Three steps to a running channel
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.1}>
                <div className="relative glass-card rounded-3xl p-6 border border-white/10 h-full space-y-3.5">
                  <span className="absolute top-5 right-6 text-4xl font-extrabold text-white/[0.06] select-none">
                    {index + 1}
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-indigo-400">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="py-20 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <Reveal>
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.2em]">
                Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Start free. Upgrade when you outgrow it.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Limits are enforced on the server, so what a plan says is what a plan
                does.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLAN_ORDER.map((planId, index) => {
              const plan = PLANS[planId];
              return (
                <Reveal key={plan.id} delay={index * 0.08}>
                  <div
                    className={cn(
                      "relative rounded-3xl p-6 h-full flex flex-col space-y-5",
                      plan.highlighted
                        ? "glass-panel border border-indigo-500/40 shadow-2xl shadow-indigo-500/10"
                        : "glass-card border border-white/10"
                    )}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-3 left-6 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                        MOST POPULAR
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                          {formatPlanPrice(plan)}
                        </span>
                        {plan.priceCents > 0 && (
                          <span className="text-xs text-zinc-500 font-medium">/month</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {plan.tagline}
                      </p>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-zinc-300 leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant={plan.highlighted ? "gradient" : "apple"}
                      className="w-full rounded-2xl h-11 text-sm font-semibold"
                    >
                      <Link href="/signup">
                        {plan.priceCents === 0 ? "Get started free" : `Choose ${plan.name}`}
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
      {/* FAQ — native <details> so this section needs no JavaScript           */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="py-20 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-3xl mx-auto space-y-10">
          <Reveal>
            <div className="space-y-3 text-center">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-[0.2em]">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Straight answers
              </h2>
            </div>
          </Reveal>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <Reveal key={faq.q} delay={index * 0.05}>
                <details className="group glass-card rounded-2xl border border-white/10 overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-2xl">
                    <span className="text-sm font-semibold text-white">{faq.q}</span>
                    <span
                      aria-hidden
                      className="shrink-0 w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 transition-transform duration-200 group-open:rotate-45"
                    >
                      <span className="text-base leading-none">+</span>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
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
      <section className="py-20 px-4 sm:px-6">
        <Reveal>
          <div className="relative max-w-5xl mx-auto glass-panel rounded-[2rem] border border-white/10 p-8 sm:p-14 text-center overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none"
            />
            <div className="relative space-y-6">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20 mx-auto">
                <Zap className="w-7 h-7 fill-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Stop rewriting the same post seven times
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Create an account, connect a channel, and publish your first
                cross-platform post in a few minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                <Button
                  asChild
                  variant="gradient"
                  size="lg"
                  className="h-13 px-8 rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-500/25"
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
                  className="h-13 px-8 rounded-2xl text-sm font-semibold"
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
      <footer className="border-t border-white/[0.07] py-10 px-4 sm:px-6">
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
