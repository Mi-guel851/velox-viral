/**
 * Subscription plans and their limits.
 *
 * Single source of truth for both the pricing UI and server-side enforcement.
 * The limits here are checked in API routes before an action runs, so a plan
 * boundary cannot be bypassed by editing client state.
 *
 * Billing runs on Paystack. Amounts are held per supported currency in the
 * currency's *minor* unit (kobo for NGN, cents for USD/ZAR/KES, pesewas for
 * GHS), which is what the Paystack API expects. `PAYSTACK_CURRENCY` selects
 * which one is displayed and charged.
 *
 * IMPORTANT: these amounts are for display and must match the amount on the
 * corresponding Paystack Plan. Paystack itself is authoritative for what is
 * actually charged — the app never computes a charge client-side.
 */
import type { PlanId } from "@/lib/database.types";

export type BillingCurrency = "NGN" | "GHS" | "ZAR" | "KES" | "USD";

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
  /** Monthly amount per currency, in the currency's minor unit. Empty = free. */
  amounts: Partial<Record<BillingCurrency, number>>;
  tagline: string;
  limits: PlanLimits;
  features: string[];
  /** Highlighted in the pricing grid. */
  highlighted?: boolean;
  /** Env var holding this plan's Paystack plan code. */
  planCodeEnvKey?: "PAYSTACK_PLAN_PRO" | "PAYSTACK_PLAN_BUSINESS";
}

/** `Infinity` denotes genuinely unmetered, and is handled explicitly in checks. */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    amounts: {},
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
    amounts: {
      NGN: 1_500_000, // ₦15,000
      GHS: 25_000, // GH₵250
      ZAR: 34_900, // R349
      KES: 250_000, // KSh2,500
      USD: 1_900, // $19
    },
    tagline: "For creators running every channel at once.",
    highlighted: true,
    planCodeEnvKey: "PAYSTACK_PLAN_PRO",
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
    amounts: {
      NGN: 3_900_000, // ₦39,000
      GHS: 65_000, // GH₵650
      ZAR: 89_900, // R899
      KES: 650_000, // KSh6,500
      USD: 4_900, // $49
    },
    tagline: "Unmetered publishing and the full analytics archive.",
    planCodeEnvKey: "PAYSTACK_PLAN_BUSINESS",
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

/** Fallback used when PAYSTACK_CURRENCY is unset — Paystack's primary currency. */
export const DEFAULT_BILLING_CURRENCY: BillingCurrency = "NGN";

export function getPlan(id: PlanId | null | undefined): Plan {
  return PLANS[id ?? "free"] ?? PLANS.free;
}

/** Amount in minor units for a plan in a currency, or 0 for free plans. */
export function planAmount(plan: Plan, currency: BillingCurrency): number {
  return plan.amounts[currency] ?? 0;
}

/**
 * Formats a plan price for display, e.g. "₦15,000" or "$19".
 * Uses Intl so each currency gets its correct symbol and grouping.
 */
export function formatPlanPrice(
  plan: Plan,
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY
): string {
  const minor = planAmount(plan, currency);
  if (minor === 0) return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    // Whole-unit pricing reads cleaner on a pricing grid.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

/** Renders a limit for display, collapsing Infinity to a word. */
export function formatLimit(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : "Unlimited";
}

/** Whether a usage count is still within the plan's allowance. */
export function isWithinLimit(used: number, limit: number): boolean {
  return !Number.isFinite(limit) || used < limit;
}
