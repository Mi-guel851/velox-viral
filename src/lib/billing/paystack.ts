/**
 * Paystack billing client.
 *
 * Everything here is server-only. The browser never sees the secret key and
 * never computes an amount: checkout is initialised on the server, the user is
 * redirected to Paystack's hosted page, and subscription state is only ever
 * written from the verified webhook. That means a user cannot appear subscribed
 * by manipulating the frontend.
 *
 * Docs: https://paystack.com/docs/api/
 */
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv, isBillingConfigured, getPaystackPlanCode } from "@/lib/env.server";
import type { BillingCurrency } from "@/lib/plans";

const PAYSTACK_API = "https://api.paystack.co";

export class BillingNotConfiguredError extends Error {
  constructor() {
    super("Paystack is not configured. Set PAYSTACK_SECRET_KEY to enable billing.");
    this.name = "BillingNotConfiguredError";
  }
}

export class BillingError extends Error {
  readonly userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "BillingError";
    this.userMessage = userMessage ?? "We couldn't reach the payment provider. Please try again.";
  }
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackRequest<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  if (!isBillingConfigured()) throw new BillingNotConfiguredError();

  const { timeoutMs = 20_000, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_API}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${serverEnv.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...rest.headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new BillingError(`Network error calling Paystack ${path}`, undefined);
  }

  const bodyText = await response.text();

  let envelope: PaystackEnvelope<T> | null = null;
  try {
    envelope = JSON.parse(bodyText) as PaystackEnvelope<T>;
  } catch {
    // Non-JSON response.
  }

  if (!response.ok || !envelope?.status) {
    // Log the provider detail; return something safe to the user.
    console.error(
      `[paystack] ${rest.method ?? "GET"} ${path} → ${response.status}`,
      bodyText.slice(0, 800)
    );
    throw new BillingError(
      `Paystack ${path} failed with ${response.status}: ${envelope?.message ?? bodyText.slice(0, 200)}`,
      envelope?.message && response.status < 500
        ? envelope.message
        : "The payment provider rejected that request. Please try again."
    );
  }

  return envelope.data;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface InitializeCheckoutParams {
  email: string;
  /** Our user id, echoed back through the webhook so we know who paid. */
  userId: string;
  plan: "pro" | "business";
  currency: BillingCurrency;
  /** Where Paystack returns the user after payment. */
  callbackUrl: string;
}

export interface CheckoutSession {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Starts a subscription checkout.
 *
 * Passing `plan` (rather than a raw amount) makes Paystack use the plan's own
 * amount and interval, and creates a real recurring subscription on success —
 * so the price charged always matches the dashboard, not our config.
 */
export async function initializeCheckout(
  params: InitializeCheckoutParams
): Promise<CheckoutSession> {
  const planCode = getPaystackPlanCode(params.plan);
  if (!planCode) {
    throw new BillingError(
      `No Paystack plan code configured for ${params.plan}`,
      `The ${params.plan} plan isn't available yet — it hasn't been set up with the payment provider.`
    );
  }

  const data = await paystackRequest<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      plan: planCode,
      currency: params.currency,
      callback_url: params.callbackUrl,
      // Echoed back on charge.success so the webhook can attribute the payment.
      metadata: {
        user_id: params.userId,
        plan: params.plan,
        cancel_action: params.callbackUrl,
      },
    }),
  });

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export interface VerifiedTransaction {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  customerCode: string | null;
  customerEmail: string | null;
  planCode: string | null;
  userId: string | null;
  plan: string | null;
}

/**
 * Verifies a transaction directly with Paystack.
 *
 * Used on the return-from-checkout redirect: the redirect itself proves nothing
 * (a user can navigate to it), so entitlement is only granted after this call
 * or the webhook confirms `status === "success"`.
 */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const data = await paystackRequest<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    customer?: { customer_code?: string; email?: string };
    plan?: string | { plan_code?: string } | null;
    plan_object?: { plan_code?: string };
    metadata?: { user_id?: string; plan?: string };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  const planCode =
    typeof data.plan === "string"
      ? data.plan
      : data.plan?.plan_code ?? data.plan_object?.plan_code ?? null;

  return {
    status: data.status,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
    paidAt: data.paid_at ?? null,
    customerCode: data.customer?.customer_code ?? null,
    customerEmail: data.customer?.email ?? null,
    planCode,
    userId: data.metadata?.user_id ?? null,
    plan: data.metadata?.plan ?? null,
  };
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export interface PaystackSubscription {
  subscriptionCode: string;
  emailToken: string | null;
  status: string;
  planCode: string | null;
  customerCode: string | null;
  nextPaymentDate: string | null;
}

/** Finds the subscription belonging to a customer, newest first. */
export async function findSubscriptionForCustomer(
  customerCode: string
): Promise<PaystackSubscription | null> {
  const data = await paystackRequest<
    {
      subscription_code: string;
      email_token?: string;
      status: string;
      next_payment_date?: string | null;
      plan?: { plan_code?: string };
      customer?: { customer_code?: string };
    }[]
  >(`/subscription?customer=${encodeURIComponent(customerCode)}&perPage=10`);

  const active = data.find((item) => item.status === "active") ?? data[0];
  if (!active) return null;

  return {
    subscriptionCode: active.subscription_code,
    emailToken: active.email_token ?? null,
    status: active.status,
    planCode: active.plan?.plan_code ?? null,
    customerCode: active.customer?.customer_code ?? customerCode,
    nextPaymentDate: active.next_payment_date ?? null,
  };
}

export async function fetchSubscription(
  subscriptionCode: string
): Promise<PaystackSubscription | null> {
  const data = await paystackRequest<{
    subscription_code: string;
    email_token?: string;
    status: string;
    next_payment_date?: string | null;
    plan?: { plan_code?: string };
    customer?: { customer_code?: string };
  }>(`/subscription/${encodeURIComponent(subscriptionCode)}`);

  return {
    subscriptionCode: data.subscription_code,
    emailToken: data.email_token ?? null,
    status: data.status,
    planCode: data.plan?.plan_code ?? null,
    customerCode: data.customer?.customer_code ?? null,
    nextPaymentDate: data.next_payment_date ?? null,
  };
}

/**
 * Cancels a subscription at the end of the current period.
 *
 * Paystack requires both the subscription code and its email token, which is
 * why the token is persisted in `subscriptions.provider_metadata`. If we don't
 * have it, it is re-fetched rather than failing.
 */
export async function disableSubscription(
  subscriptionCode: string,
  emailToken: string | null
): Promise<void> {
  let token = emailToken;

  if (!token) {
    const subscription = await fetchSubscription(subscriptionCode);
    token = subscription?.emailToken ?? null;
  }

  if (!token) {
    throw new BillingError(
      `Cannot disable subscription ${subscriptionCode} without an email token`,
      "We couldn't cancel this subscription automatically. Please contact support."
    );
  }

  await paystackRequest("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code: subscriptionCode, token }),
  });
}

/** Re-enables a subscription that was set not to renew. */
export async function enableSubscription(
  subscriptionCode: string,
  emailToken: string | null
): Promise<void> {
  let token = emailToken;
  if (!token) {
    const subscription = await fetchSubscription(subscriptionCode);
    token = subscription?.emailToken ?? null;
  }
  if (!token) {
    throw new BillingError(
      `Cannot enable subscription ${subscriptionCode} without an email token`,
      "We couldn't resume this subscription automatically. Please contact support."
    );
  }

  await paystackRequest("/subscription/enable", {
    method: "POST",
    body: JSON.stringify({ code: subscriptionCode, token }),
  });
}

// ---------------------------------------------------------------------------
// Webhook verification
// ---------------------------------------------------------------------------

/**
 * Verifies a webhook signature.
 *
 * Paystack sends an HMAC-SHA512 of the RAW request body keyed with the secret
 * key, in `x-paystack-signature`. The body must be hashed exactly as received —
 * parsing and re-serialising it changes the bytes and the signature will never
 * match. Compared in constant time so the digest can't be probed via timing.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !serverEnv.PAYSTACK_SECRET_KEY) return false;

  const expected = createHmac("sha512", serverEnv.PAYSTACK_SECRET_KEY)
    .update(rawBody, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/** Maps a Paystack plan code back to one of our plan ids. */
export function planIdFromPaystackCode(planCode: string | null): "pro" | "business" | null {
  if (!planCode) return null;
  if (planCode === getPaystackPlanCode("pro")) return "pro";
  if (planCode === getPaystackPlanCode("business")) return "business";
  return null;
}

/** Maps Paystack subscription status onto our subscription status vocabulary. */
export function mapPaystackStatus(
  status: string
): "active" | "past_due" | "canceled" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "attention":
    case "pending":
      return "past_due";
    case "complete":
    case "cancelled":
    case "canceled":
    case "non-renewing":
      return "canceled";
    default:
      return "incomplete";
  }
}
