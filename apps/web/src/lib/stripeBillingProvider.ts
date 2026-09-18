import { createHmac, timingSafeEqual } from "node:crypto";

import type {
    BillingCancelSubscriptionInput,
    BillingCheckoutInput,
    BillingCheckoutSession,
    BillingProvider,
    BillingWebhookInput,
    NormalizedBillingEvent,
} from "./billingProvider";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const DEFAULT_SIGNATURE_TOLERANCE_SECONDS = 300;

interface StripeSubscriptionLike {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    metadata?: Record<string, string> | null;
    items?: { data?: Array<{ price?: { id?: string } }> };
}

function requiredSecret(name: string, environment = process.env): string {
    const value = environment[name];
    if (!value?.trim()) throw new Error(`${name} is not configured.`);
    return value.trim();
}

function unixSecondsToIso(value: unknown): string | null {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return new Date(value * 1000).toISOString();
}

function signatureParts(value: string): { timestamp: number; signatures: string[] } {
    const parts = value.split(",");
    let timestamp: number | null = null;
    const signatures: string[] = [];
    for (const part of parts) {
        const [key, raw] = part.split("=", 2);
        if (key === "t" && raw) timestamp = Number(raw);
        if (key === "v1" && raw) signatures.push(raw);
    }
    if (!timestamp || !Number.isFinite(timestamp) || !signatures.length) {
        throw new Error("Invalid Stripe-Signature header.");
    }
    return { timestamp, signatures };
}

function verifyStripeSignature(rawBody: string, signature: string, secret: string, nowMs = Date.now()): void {
    const { timestamp, signatures } = signatureParts(signature);
    const age = Math.abs(nowMs / 1000 - timestamp);
    const tolerance = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS ?? DEFAULT_SIGNATURE_TOLERANCE_SECONDS);
    if (!Number.isFinite(tolerance) || tolerance < 1 || age > tolerance) {
        throw new Error("Stripe webhook signature timestamp is outside the allowed tolerance.");
    }

    const expected = createHmac("sha256", secret)
        .update(`${timestamp}.${rawBody}`, "utf8")
        .digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");

    const valid = signatures.some((candidate) => {
        const candidateBuffer = Buffer.from(candidate, "utf8");
        return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
    });
    if (!valid) throw new Error("Stripe webhook signature verification failed.");
}

function formBody(values: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
        if (value !== undefined) params.set(key, value);
    }
    return params.toString();
}

async function stripeRequest<T>(path: string, init: RequestInit = {}, environment = process.env): Promise<T> {
    const secret = requiredSecret("STRIPE_SECRET_KEY", environment);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${secret}`);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/x-www-form-urlencoded");

    const response = await fetch(`${STRIPE_API_BASE}${path}`, { ...init, headers, cache: "no-store" });
    const payload = await response.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(payload); } catch { /* handled by response status below */ }
    if (!response.ok) {
        const message = parsed && typeof parsed === "object" && "error" in parsed
            ? String((parsed as { error?: { message?: unknown } }).error?.message ?? payload)
            : payload || `Stripe request failed with ${response.status}.`;
        throw new Error(message);
    }
    return parsed as T;
}

function priceEnvironmentKey(planCode: string): string {
    const normalized = planCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (!normalized) throw new Error("Plan code is required.");
    return `STRIPE_PRICE_${normalized}`;
}

function requiredPriceId(planCode: string): string {
    const key = priceEnvironmentKey(planCode);
    const value = process.env[key]?.trim();
    if (!value) throw new Error(`${key} is not configured for this BSMP plan.`);
    return value;
}

function eventTypeFor(status: string): NormalizedBillingEvent["eventType"] {
    switch (status) {
        case "trialing": return "trial_started";
        case "active": return "activated";
        case "past_due": return "past_due";
        case "paused": return "paused";
        case "canceled": return "canceled";
        default: return "provider_synced";
    }
}

function normalizeSubscriptionEvent(subscription: StripeSubscriptionLike, externalEventId: string): NormalizedBillingEvent {
    const planCode = subscription.metadata?.plan_code || null;
    const userId = subscription.metadata?.user_id || null;
    return {
        provider: "stripe",
        externalEventId,
        eventType: eventTypeFor(subscription.status),
        userId,
        planCode,
        externalCustomerId: subscription.customer,
        externalSubscriptionId: subscription.id,
        status: subscription.status === "unpaid" ? "past_due" : subscription.status === "incomplete_expired" ? "canceled" : subscription.status as NormalizedBillingEvent["status"],
        currentPeriodStart: unixSecondsToIso(subscription.current_period_start),
        currentPeriodEnd: unixSecondsToIso(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        effectiveAt: new Date().toISOString(),
        metadata: {
            source: "stripe_webhook",
            price_id: subscription.items?.data?.[0]?.price?.id ?? null,
        },
    };
}

export class StripeBillingProvider implements BillingProvider {
    readonly id = "stripe";

    async createCheckoutSession(input: BillingCheckoutInput): Promise<BillingCheckoutSession> {
        const priceId = requiredPriceId(input.planCode);
        const body = formBody({
            mode: "subscription",
            "line_items[0][price]": priceId,
            "line_items[0][quantity]": "1",
            client_reference_id: input.userId,
            customer_email: input.customerEmail ?? undefined,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            "metadata[user_id]": input.userId,
            "metadata[plan_code]": input.planCode,
            "subscription_data[metadata][user_id]": input.userId,
            "subscription_data[metadata][plan_code]": input.planCode,
        });
        const session = await stripeRequest<{ id: string; url?: string | null; customer?: string | null; subscription?: string | null; expires_at?: number }>("/checkout/sessions", { method: "POST", body });
        if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
        return {
            provider: "stripe",
            checkoutUrl: session.url,
            externalCustomerId: session.customer ?? null,
            externalSubscriptionId: session.subscription ?? null,
            expiresAt: unixSecondsToIso(session.expires_at),
        };
    }

    async cancelSubscription(input: BillingCancelSubscriptionInput): Promise<void> {
        if (input.cancelAtPeriodEnd) {
            const body = formBody({ cancel_at_period_end: "true" });
            await stripeRequest<StripeSubscriptionLike>(`/subscriptions/${encodeURIComponent(input.externalSubscriptionId)}`, { method: "POST", body });
            return;
        }
        await stripeRequest<StripeSubscriptionLike>(`/subscriptions/${encodeURIComponent(input.externalSubscriptionId)}`, { method: "DELETE" });
    }

    async verifyWebhook(input: BillingWebhookInput): Promise<NormalizedBillingEvent[]> {
        const secret = requiredSecret("STRIPE_WEBHOOK_SECRET");
        const signature = input.headers["stripe-signature"] ?? input.headers["Stripe-Signature"];
        if (!signature) throw new Error("Stripe-Signature header is required.");
        verifyStripeSignature(input.rawBody, signature, secret);

        const payload = JSON.parse(input.rawBody) as { id?: string; type?: string; data?: { object?: unknown } };
        const eventId = payload.id?.trim();
        if (!eventId) throw new Error("Stripe webhook event id is missing.");
        const object = payload.data?.object as Record<string, unknown> | undefined;

        switch (payload.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                return [normalizeSubscriptionEvent(object as unknown as StripeSubscriptionLike, eventId)];
            case "invoice.payment_failed": {
                const subscriptionId = typeof object?.subscription === "string" ? object.subscription : null;
                const customer = typeof object?.customer === "string" ? object.customer : null;
                if (!subscriptionId) return [];
                return [{
                    provider: "stripe",
                    externalEventId: eventId,
                    eventType: "past_due",
                    externalCustomerId: customer,
                    externalSubscriptionId: subscriptionId,
                    status: "past_due",
                    effectiveAt: new Date().toISOString(),
                    metadata: { source: "stripe_webhook", event_type: payload.type },
                }];
            }
            default:
                return [];
        }
    }
}

export function createStripeBillingProvider(): StripeBillingProvider {
    return new StripeBillingProvider();
}

export const __test__ = { verifyStripeSignature, signatureParts, priceEnvironmentKey, eventTypeFor };
