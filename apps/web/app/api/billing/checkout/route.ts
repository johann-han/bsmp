import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getBillingProvider } from "../../../../src/lib/billingProviderRegistry";

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
        const authClient = createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
        const { data: userData, error: userError } = await authClient.auth.getUser(token);
        if (userError || !userData.user) return NextResponse.json({ error: "A valid signed-in Supabase session is required." }, { status: 401 });

        const body = await request.json() as Record<string, unknown>;
        const planCode = typeof body.planCode === "string" ? body.planCode.trim().toLowerCase() : "";
        if (!planCode) return NextResponse.json({ error: "Plan code is required." }, { status: 400 });

        const client = serviceClient();
        const { data: plan, error: planError } = await client.from("subscription_plans").select("id, code, name, active").eq("code", planCode).eq("active", true).maybeSingle();
        if (planError) throw planError;
        if (!plan) return NextResponse.json({ error: "The selected subscription plan is not available." }, { status: 404 });

        const { data: existing, error: existingError } = await client.from("user_subscriptions").select("id").eq("user_id", userData.user.id).in("status", ["trialing", "active", "past_due", "paused", "incomplete"]).limit(1);
        if (existingError) throw existingError;
        if (existing?.length) return NextResponse.json({ error: "This account already has a subscription. Manage the existing subscription before starting another checkout." }, { status: 409 });

        const provider = getBillingProvider();
        const origin = new URL(request.url).origin;
        const result = await provider.createCheckoutSession({
            userId: userData.user.id,
            planCode: plan.code,
            customerEmail: userData.user.email ?? null,
            successUrl: `${origin}/settings/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/settings/subscription?checkout=canceled`,
        });

        return NextResponse.json({ checkoutUrl: result.checkoutUrl, provider: result.provider, planName: plan.name });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to start subscription checkout.";
        const status = message.includes("signed-in") ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
