import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { applyNormalizedBillingEvent } from "../../../../../src/lib/billingSubscriptionSync";
import { getBillingProvider } from "../../../../../src/lib/billingProviderRegistry";
import { payFastValidateServerConfirmation } from "../../../../../src/lib/payfastBillingProvider";
import { requestIp, verifyPayFastSourceIp } from "../../../../../src/lib/payfastItn";

function serviceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Billing is not configured on the server.");
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function parsePayFastBody(request: Request): Promise<{
    values: Record<string, string>;
    normalizedBody: string;
}> {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (contentType.includes("multipart/form-data")) {
        const form = await request.formData();
        const values: Record<string, string> = {};
        for (const [key, value] of form.entries()) {
            if (typeof value === "string") values[key] = value;
        }
        return {
            values,
            normalizedBody: new URLSearchParams(values).toString(),
        };
    }

    const rawBody = await request.text();
    const values: Record<string, string> = {};
    for (const [key, value] of new URLSearchParams(rawBody).entries()) values[key] = value;
    return { values, normalizedBody: rawBody };
}

export async function POST(request: Request) {
    try {
        const provider = getBillingProvider();
        if (provider.id !== "payfast") {
            return NextResponse.json({ error: "PayFast billing provider is not active." }, { status: 404 });
        }

        const { values, normalizedBody } = await parsePayFastBody(request);

        await verifyPayFastSourceIp(requestIp(request.headers));

        // Verify the signed ITN before making the outbound PayFast confirmation request.
        // This keeps the provider round-trip behind the local authenticity checks.
        const events = await provider.verifyWebhook({
            rawBody: normalizedBody,
            headers: { "user-agent": request.headers.get("user-agent") },
        });

        if (!events.length) return NextResponse.json({ received: true, processed: 0 });

        const confirmed = await payFastValidateServerConfirmation(values);
        if (!confirmed) throw new Error("PayFast server confirmation failed.");

        const client = serviceClient();
        const paymentReference = values.m_payment_id?.trim() || null;
        const token = values.token?.trim() || null;

        let intent: {
            id: string;
            user_id: string;
            plan_id: string;
            amount: string | number;
            payment_reference: string;
        } | null = null;

        if (paymentReference) {
            const { data, error } = await client
                .from("billing_checkout_intents")
                .select("id, user_id, plan_id, amount, payment_reference")
                .eq("provider", "payfast")
                .eq("payment_reference", paymentReference)
                .maybeSingle();

            if (error) throw error;
            intent = data;
        }

        if (!intent && token) {
            const { data, error } = await client
                .from("billing_checkout_intents")
                .select("id, user_id, plan_id, amount, payment_reference")
                .eq("provider", "payfast")
                .eq("external_subscription_id", token)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            intent = data;
        }

        if (!intent) {
            throw new Error("The PayFast payment could not be matched to a BSMP checkout intent.");
        }

        if (
            !values.amount_gross ||
            Math.abs(Number(intent.amount) - Number(values.amount_gross)) > 0.01
        ) {
            throw new Error("PayFast payment amount does not match the expected BSMP subscription amount.");
        }

        const { data: plan, error: planError } = await client
            .from("subscription_plans")
            .select("code")
            .eq("id", intent.plan_id)
            .single();

        if (planError) throw planError;

        const results = [];
        for (const event of events) {
            const enriched = {
                ...event,
                userId: event.userId ?? intent.user_id,
                planCode: event.planCode ?? plan.code,
                metadata: {
                    ...(event.metadata ?? {}),
                    payment_reference: intent.payment_reference,
                    expected_amount: String(intent.amount),
                },
            };
            results.push(await applyNormalizedBillingEvent(enriched));
        }

        const terminalStatus =
            values.payment_status === "CANCELLED" ? "canceled" : "completed";

        const { error: updateError } = await client
            .from("billing_checkout_intents")
            .update({
                status: terminalStatus,
                external_subscription_id: token,
                completed_at: new Date().toISOString(),
            })
            .eq("id", intent.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            received: true,
            processed: results.length,
            results,
        });
    } catch (reason) {
        const message =
            reason instanceof Error
                ? reason.message
                : "Unable to process PayFast ITN.";

        console.error("PayFast ITN processing failed:", reason);
        // A 4xx is appropriate for rejected/invalid provider input; processing or
        // provider-confirmation failures must remain retryable by PayFast.
        const retryable = /server confirmation|checkout intent|subscription synchronization|billing is not configured|database|returned an invalid result/i.test(message);
        return NextResponse.json({ error: "Unable to process PayFast ITN." }, { status: retryable ? 500 : 400 });
    }
}
