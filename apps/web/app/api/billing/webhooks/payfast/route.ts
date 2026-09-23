import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { applyNormalizedBillingEvent } from "../../../../../src/lib/billingSubscriptionSync";
import { getBillingProvider } from "../../../../../src/lib/billingProviderRegistry";
import {
    findBillingPaymentAttempt,
    findPayFastSubscriptionByToken,
    markBillingPaymentAttempt,
} from "../../../../../src/lib/payfastPaymentAttempts";
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

function amount(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error("PayFast amount is invalid.");
    return Number(parsed.toFixed(2));
}

function closeEnough(a: number, b: number): boolean {
    return Math.abs(a - b) <= 0.01;
}

export async function POST(request: Request) {
    try {
        const provider = getBillingProvider();
        if (provider.id !== "payfast") {
            return NextResponse.json({ error: "PayFast billing provider is not active." }, { status: 404 });
        }

        const { values, normalizedBody } = await parsePayFastBody(request);

        await verifyPayFastSourceIp(requestIp(request.headers));

        const events = await provider.verifyWebhook({
            rawBody: normalizedBody,
            headers: { "user-agent": request.headers.get("user-agent") },
        });

        if (!events.length) return NextResponse.json({ received: true, processed: 0 });

        const confirmed = await payFastValidateServerConfirmation(values);
        if (!confirmed) throw new Error("PayFast server confirmation failed.");

        const results = [];
        for (const event of events) {
            const metadata = event.metadata ?? {};
            const merchantPaymentId =
                typeof metadata.m_payment_id === "string" && metadata.m_payment_id.trim()
                    ? metadata.m_payment_id.trim()
                    : null;
            const grossAmount =
                metadata.amount_gross === null || metadata.amount_gross === undefined
                    ? null
                    : amount(metadata.amount_gross);
            const token = event.externalSubscriptionId?.trim() || null;

            const subscription = token
                ? await findPayFastSubscriptionByToken(token)
                : null;
            const attempt = merchantPaymentId
                ? await findBillingPaymentAttempt(merchantPaymentId)
                : null;

            if (!subscription && !attempt) {
                throw new Error("PayFast ITN could not be matched to a pending payment attempt or existing subscription.");
            }

            if (event.eventType === "canceled") {
                if (subscription) {
                    if (event.userId && subscription.user_id !== event.userId) {
                        throw new Error("PayFast ITN user identity does not match the existing subscription.");
                    }

                    const normalizedEvent = {
                        ...event,
                        userId: subscription.user_id,
                    };
                    results.push(await applyNormalizedBillingEvent(normalizedEvent));
                }

                if (attempt) {
                    await markBillingPaymentAttempt(attempt.id, {
                        status: "cancelled",
                        externalPaymentId:
                            typeof metadata.pf_payment_id === "string"
                                ? metadata.pf_payment_id
                                : null,
                        externalSubscriptionId: token,
                        metadata: {
                            ...attempt.metadata,
                            last_payment_status: metadata.payment_status ?? null,
                            amount_gross: grossAmount,
                        },
                    });
                }

                continue;
            }

            if (event.eventType !== "activated") {
                throw new Error("Unsupported PayFast billing event.");
            }

            if (subscription) {
                if (event.userId && subscription.user_id !== event.userId) {
                    throw new Error("PayFast ITN user identity does not match the existing subscription.");
                }

                if (grossAmount !== null) {
                    const recurringAmount = Number(
                        subscription.metadata.recurring_amount_zar ??
                        attempt?.metadata.recurring_amount ??
                        0,
                    );
                    if (recurringAmount > 0 && !closeEnough(grossAmount, recurringAmount)) {
                        throw new Error("PayFast recurring payment amount does not match the recorded subscription amount.");
                    }
                }

                results.push(await applyNormalizedBillingEvent({
                    ...event,
                    eventType: "provider_synced",
                    userId: subscription.user_id,
                    planCode: event.planCode ?? null,
                }));

                if (attempt) {
                    await markBillingPaymentAttempt(attempt.id, {
                        status: "complete",
                        externalPaymentId:
                            typeof metadata.pf_payment_id === "string"
                                ? metadata.pf_payment_id
                                : null,
                        externalSubscriptionId: token,
                        metadata: {
                            ...attempt.metadata,
                            last_payment_status: metadata.payment_status ?? null,
                            amount_gross: grossAmount,
                        },
                    });
                }

                continue;
            }

            if (!attempt) {
                throw new Error("PayFast initial payment could not be matched to a checkout attempt.");
            }

            if (event.userId && attempt.user_id !== event.userId) {
                throw new Error("PayFast payment identity does not match the checkout account.");
            }

            if (grossAmount === null || !closeEnough(grossAmount, Number(attempt.amount))) {
                throw new Error("PayFast payment amount does not match the recorded checkout amount.");
            }

            const client = serviceClient();
            const { data: existingSubscriptions, error: existingSubscriptionError } = await client
                .from("user_subscriptions")
                .select("id, provider, external_subscription_id, status")
                .eq("user_id", attempt.user_id)
                .in("status", ["trialing", "active", "past_due", "paused", "incomplete"]);

            if (existingSubscriptionError) throw existingSubscriptionError;

            const conflictingSubscription = (existingSubscriptions ?? []).find(
                (item) =>
                    !(
                        item.provider === "payfast" &&
                        item.external_subscription_id &&
                        item.external_subscription_id === token
                    ),
            );

            if (conflictingSubscription && token) {
                await provider.cancelSubscription({
                    externalSubscriptionId: token,
                    cancelAtPeriodEnd: false,
                });

                await markBillingPaymentAttempt(attempt.id, {
                    status: "failed",
                    externalPaymentId:
                        typeof metadata.pf_payment_id === "string"
                            ? metadata.pf_payment_id
                            : null,
                    externalSubscriptionId: token,
                    metadata: {
                        ...attempt.metadata,
                        reconciliation: "duplicate_active_subscription",
                        existing_subscription_id: conflictingSubscription.id,
                        existing_provider: conflictingSubscription.provider,
                        existing_external_subscription_id:
                            conflictingSubscription.external_subscription_id,
                        last_payment_status: metadata.payment_status ?? null,
                        amount_gross: grossAmount,
                    },
                });

                return NextResponse.json({
                    received: true,
                    processed: 0,
                    reconciled: "duplicate_subscription_canceled",
                });
            }

            const { data: plan, error: planError } = await client
                .from("subscription_plans")
                .select("code")
                .eq("id", attempt.plan_id)
                .single();

            if (planError) throw planError;

            results.push(await applyNormalizedBillingEvent({
                ...event,
                userId: attempt.user_id,
                planCode: event.planCode ?? plan.code,
                metadata: {
                    ...(event.metadata ?? {}),
                    payment_reference: attempt.merchant_payment_id,
                    expected_amount: String(attempt.amount),
                },
            }));

            await markBillingPaymentAttempt(attempt.id, {
                status: "complete",
                externalPaymentId:
                    typeof metadata.pf_payment_id === "string"
                        ? metadata.pf_payment_id
                        : null,
                externalSubscriptionId: token,
                metadata: {
                    ...attempt.metadata,
                    last_payment_status: metadata.payment_status ?? null,
                    amount_gross: grossAmount,
                },
            });
        }

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

        const retryable =
            /server confirmation|subscription cancellation|payment attempt|subscription synchronization|billing is not configured|database|PayFast API request failed/i.test(
                message,
            );

        return NextResponse.json(
            { error: "Unable to process PayFast ITN." },
            { status: retryable ? 500 : 400 },
        );
    }
}
