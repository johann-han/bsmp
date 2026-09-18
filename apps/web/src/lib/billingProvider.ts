export type BillingSubscriptionStatus =
    | "trialing"
    | "active"
    | "past_due"
    | "paused"
    | "canceled"
    | "incomplete";

export interface BillingCheckoutInput {
    userId: string;
    planCode: string;
    paymentReference: string;
    customerEmail?: string | null;
    successUrl: string;
    cancelUrl: string;
}

export interface BillingCheckoutSession {
    provider: string;
    checkoutUrl: string;
    checkoutMethod?: "GET" | "POST";
    formFields?: Record<string, string>;
    amount?: string | null;
    currency?: string;
    externalCustomerId?: string | null;
    externalSubscriptionId?: string | null;
    expiresAt?: string | null;
}

export interface BillingCancelSubscriptionInput {
    externalSubscriptionId: string;
    cancelAtPeriodEnd: boolean;
}

export type BillingEventType =
    | "activated"
    | "trial_started"
    | "past_due"
    | "paused"
    | "canceled"
    | "ended"
    | "provider_synced";

export interface NormalizedBillingEvent {
    provider: string;
    externalEventId?: string | null;
    eventType: BillingEventType;
    userId?: string | null;
    planCode?: string | null;
    externalCustomerId?: string | null;
    externalSubscriptionId?: string | null;
    status?: BillingSubscriptionStatus | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    effectiveAt?: string | null;
    metadata?: Record<string, unknown>;
}

export interface BillingWebhookInput {
    rawBody: string;
    headers: Record<string, string | null>;
}

export interface BillingProvider {
    readonly id: string;

    createCheckoutSession(
        input: BillingCheckoutInput,
    ): Promise<BillingCheckoutSession>;

    cancelSubscription(
        input: BillingCancelSubscriptionInput,
    ): Promise<void>;

    verifyWebhook(
        input: BillingWebhookInput,
    ): Promise<NormalizedBillingEvent[]>;
}

export function normalizeBillingProviderId(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        throw new Error("Billing provider id is required.");
    }

    if (!/^[a-z0-9][a-z0-9_-]{0,49}$/.test(normalized)) {
        throw new Error("Billing provider id contains unsupported characters.");
    }

    return normalized;
}
