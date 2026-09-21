import { createClient } from "@supabase/supabase-js";

export interface BillingPaymentAttempt {
    id: string;
    user_id: string;
    plan_id: string;
    provider: string;
    merchant_payment_id: string;
    amount: number | string;
    currency: string;
    status: "pending" | "complete" | "failed" | "cancelled";
    external_payment_id: string | null;
    external_subscription_id: string | null;
    metadata: Record<string, unknown>;
}

function serverClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Billing is not configured on the server.");
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function findBillingPaymentAttempt(merchantPaymentId: string): Promise<BillingPaymentAttempt | null> {
    const { data, error } = await serverClient()
        .from("billing_payment_attempts")
        .select("id, user_id, plan_id, provider, merchant_payment_id, amount, currency, status, external_payment_id, external_subscription_id, metadata")
        .eq("provider", "payfast")
        .eq("merchant_payment_id", merchantPaymentId)
        .maybeSingle();
    if (error) throw error;
    return (data ?? null) as BillingPaymentAttempt | null;
}

export async function findPayFastSubscriptionByToken(token: string): Promise<{ id: string; user_id: string; plan_id: string; status: string } | null> {
    const { data, error } = await serverClient()
        .from("user_subscriptions")
        .select("id, user_id, plan_id, status")
        .eq("provider", "payfast")
        .eq("external_subscription_id", token)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function markBillingPaymentAttempt(
    id: string,
    update: {
        status: BillingPaymentAttempt["status"];
        externalPaymentId?: string | null;
        externalSubscriptionId?: string | null;
        metadata?: Record<string, unknown>;
    },
) {
    const { error } = await serverClient()
        .from("billing_payment_attempts")
        .update({
            status: update.status,
            external_payment_id: update.externalPaymentId ?? null,
            external_subscription_id: update.externalSubscriptionId ?? null,
            metadata: update.metadata ?? {},
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    if (error) throw error;
}
