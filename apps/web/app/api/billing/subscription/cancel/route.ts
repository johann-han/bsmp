import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getBillingProvider } from "../../../../../src/lib/billingProviderRegistry";

function authToken(request: Request): string {
    const value = request.headers.get("authorization");
    if (!value?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required.");
    const token = value.slice(7).trim();
    if (!token) throw new Error("A signed-in Supabase session is required.");
    return token;
}

function serviceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Billing is not configured on the server.");
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
    try {
        const token = authToken(request);
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !publishableKey) throw new Error("Supabase is not configured on the server.");

        const authClient = createClient(url, publishableKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userError } = await authClient.auth.getUser(token);
        if (userError || !userData.user) {
            return NextResponse.json({ error: "A valid signed-in Supabase session is required." }, { status: 401 });
        }

        const client = serviceClient();
        const { data: subscription, error: subscriptionError } = await client
            .from("user_subscriptions")
            .select("id, provider, status, external_subscription_id")
            .eq("user_id", userData.user.id)
            .in("status", ["trialing", "active", "past_due", "paused", "incomplete"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (subscriptionError) throw subscriptionError;
        if (!subscription) {
            return NextResponse.json({ error: "No active subscription was found for this account." }, { status: 404 });
        }
        if (subscription.provider !== "payfast") {
            return NextResponse.json({ error: "Self-service cancellation is currently available only for PayFast subscriptions." }, { status: 409 });
        }
        if (!subscription.external_subscription_id) {
            return NextResponse.json({ error: "The PayFast subscription identifier is missing." }, { status: 409 });
        }

        const provider = getBillingProvider();
        if (provider.id !== "payfast") {
            return NextResponse.json({ error: "PayFast billing provider is not active." }, { status: 409 });
        }

        await provider.cancelSubscription({
            externalSubscriptionId: subscription.external_subscription_id,
            cancelAtPeriodEnd: false,
        });

        return NextResponse.json({
            canceled: true,
            message: "The PayFast subscription cancellation was accepted. BSMP will update the account when the verified PayFast cancellation notification is received.",
        });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to cancel the subscription.";
        const status = message.includes("signed-in") ? 401 : 400;
        console.error("Subscription cancellation failed:", reason);
        return NextResponse.json({ error: message }, { status });
    }
}
