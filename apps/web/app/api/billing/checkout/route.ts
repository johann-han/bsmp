import { randomUUID } from "node:crypto";
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

function serverClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Billing is not configured on the server.");
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function publicAppUrl(): string {
    const value = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    if (!value) throw new Error("PUBLIC_APP_URL is not configured.");
    return value;
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

        const body = await request.json() as Record<string, unknown>;
        const planCode = typeof body.planCode === "string" ? body.planCode.trim().toLowerCase() : "";
        if (!planCode) return NextResponse.json({ error: "Plan code is required." }, { status: 400 });

        const client = serverClient();
        const { data: plan, error: planError } = await client
            .from("subscription_plans")
            .select("id, code, name, active")
            .eq("code", planCode)
            .eq("active", true)
            .maybeSingle();
        if (planError) throw planError;
        if (!plan) return NextResponse.json({ error: "The selected subscription plan is not available." }, { status: 404 });

        const { data: existing, error: existingError } = await client
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", userData.user.id)
            .in("status", ["trialing", "active", "past_due", "paused", "incomplete"])
            .limit(1);
        if (existingError) throw existingError;
        if (existing?.length) {
            return NextResponse.json({ error: "This account already has a subscription. Manage the existing subscription before starting another checkout." }, { status: 409 });
        }

        const provider = getBillingProvider();
        if (provider.id !== "payfast") return NextResponse.json({ error: "PayFast is not the active billing provider." }, { status: 409 });

        const merchantPaymentId = randomUUID();
        const publicUrl = publicAppUrl();
        const result = await provider.createCheckoutSession({
            userId: userData.user.id,
            planCode: plan.code,
            merchantPaymentId,
            customerEmail: userData.user.email ?? null,
            successUrl: `${publicUrl}/settings/subscription?checkout=success&m_payment_id=${encodeURIComponent(merchantPaymentId)}`,
            cancelUrl: `${publicUrl}/settings/subscription?checkout=canceled&m_payment_id=${encodeURIComponent(merchantPaymentId)}`,
        });

        if (!result.formAction || !result.formFields || result.amountZar === undefined) {
            throw new Error("PayFast checkout did not return a payment form.");
        }

        const { error: attemptError } = await client.from("billing_payment_attempts").insert({
            user_id: userData.user.id,
            plan_id: plan.id,
            provider: provider.id,
            merchant_payment_id: merchantPaymentId,
            amount: result.amountZar,
            currency: "ZAR",
            status: "pending",
            metadata: {
                plan_code: plan.code,
                plan_name: plan.name,
                recurring_amount: result.recurringAmountZar ?? result.amountZar,
            },
        });
        if (attemptError) throw attemptError;

        return NextResponse.json({
            provider: provider.id,
            planName: plan.name,
            merchantPaymentId,
            checkoutUrl: result.checkoutUrl ?? result.formAction,
            formAction: result.formAction,
            formFields: result.formFields,
        });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to start PayFast checkout.";
        const status = message.includes("signed-in") ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
