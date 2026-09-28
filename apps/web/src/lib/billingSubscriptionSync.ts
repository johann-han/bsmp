import { createClient } from "@supabase/supabase-js";

import type { NormalizedBillingEvent } from "./billingProvider";

export interface BillingEventSyncResult {
    readonly duplicate: boolean;
    readonly eventId: string;
    readonly subscriptionId: string | null;
}

function serverClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        throw new Error("Billing subscription synchronization is not configured on the server.");
    }

    return createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

export async function applyNormalizedBillingEvent(
    event: NormalizedBillingEvent,
): Promise<BillingEventSyncResult> {
    if (!event.provider.trim()) throw new Error("Billing event provider is required.");
    if (!event.externalEventId?.trim()) throw new Error("Billing event externalEventId is required.");
    if (!event.externalSubscriptionId?.trim()) {
        throw new Error("Billing event externalSubscriptionId is required.");
    }
    if (!event.status) throw new Error("Billing event status is required.");

    const { data, error } = await serverClient().rpc(
        "apply_subscription_billing_event",
        { p_event: event },
    );

    if (error) throw error;

    const result = data as Partial<BillingEventSyncResult> | null;
    if (
        typeof result?.duplicate !== "boolean" ||
        typeof result.eventId !== "string" ||
        (result.subscriptionId !== null && typeof result.subscriptionId !== "string")
    ) {
        throw new Error("Billing synchronization returned an invalid result.");
    }

    return {
        duplicate: result.duplicate,
        eventId: result.eventId,
        subscriptionId: result.subscriptionId ?? null,
    };
}
