/**
 * Subscription plans and their limits.
 *
 * This module is the single source of truth for both the pricing UI and
 * server-side enforcement. The limits here are checked in API routes before an
 * action runs, so a plan boundary cannot be bypassed by editing client state.
 */
import type { PlanId } from "@/lib/database.types";

export interface PlanLimits {
  /** Connected social accounts. */
  socialAccounts: number;
  /** AI generations per calendar month. */
  aiGenerationsPerMonth: number;
  /** Published posts per calendar month, counted per platform target. */
  publishedPostsPerMonth: number;
  /** How far ahead a post may be scheduled, in days. */
  scheduleHorizonDays: number;
  /** Analytics retention/lookback window, in days. */
  analyticsHistoryDays: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in the smallest currency unit (cents). 0 = free. */
  priceCents: number;
  currency: string;
  tagline: string;
  limits: PlanLimits;
  features: string[];
  /** Highlighted in the pricing grid. */
  highlighted?: boolean;
  /** Env var naming the provider price id, for server-side checkout. */
  priceEnvKey?: "STRIPE_PRICE_PRO" | "STRIPE_PRICE_BUSINESS";
}

/** `Infinity` denotes genuinely unmetered, and is handled explicitly in checks. */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    currency: "usd",
    tagline: "Everything you need to publish across three channels.",
    limits: {
      socialAccounts: 3,
      aiGenerationsPerMonth: 30,
      publishedPostsPerMonth: 30,
      scheduleHorizonDays: 14,
      analyticsHistoryDays: 30,
    },
    features: [
      "3 connected social accounts",
      "Unlimited drafts",
      "30 AI generations per month",
      "30 published posts per month",
      "Schedule up to 14 days ahead",
      "30 days of analytics history",
      "Live platform-native previews",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 1900,
    currency: "usd",
    tagline: "For creators running every channel at once.",
    highlighted: true,
    priceEnvKey: "STRIPE_PRICE_PRO",
    limits: {
      socialAccounts: 10,
      aiGenerationsPerMonth: 500,
      publishedPostsPerMonth: 500,
      scheduleHorizonDays: 90,
      analyticsHistoryDays: 365,
    },
    features: [
      "10 connected social accounts",
      "500 AI generations per month",
      "500 published posts per month",
      "Schedule up to 90 days ahead",
      "1 year of analytics history",
      "1-to-7 content repurposing",
      "Per-platform content overrides",
      "Auto first comment",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceCents: 4900,
    currency: "usd",
    tagline: "Unmetered publishing and the full analytics archive.",
    priceEnvKey: "STRIPE_PRICE_BUSINESS",
    limits: {
      socialAccounts: 50,
      aiGenerationsPerMonth: Infinity,
      publishedPostsPerMonth: Infinity,
      scheduleHorizonDays: 365,
      analyticsHistoryDays: Infinity,
    },
    features: [
      "50 connected social accounts",
      "Unlimited AI generations",
      "Unlimited published posts",
      "Schedule up to a year ahead",
      "Complete analytics history",
      "Priority publishing queue",
      "Full activity audit log",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];

export function getPlan(id: PlanId | null | undefined): Plan {
  return PLANS[id ?? "free"] ?? PLANS.free;
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.priceCents === 0) return "Free";
  return `$${(plan.priceCents / 100).toFixed(0)}`;
}

/** Renders a limit for display, collapsing Infinity to a word. */
export function formatLimit(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : "Unlimited";
}
