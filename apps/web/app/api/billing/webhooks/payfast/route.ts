import { NextResponse } from "next/server";

import { applyNormalizedBillingEvent } from "../../../../../src/lib/billingSubscriptionSync";
import { getBillingProvider } from "../../../../../src/lib/billingProviderRegistry";
import { findBillingPaymentAttempt, findPayFastSubscriptionByToken, markBillingPaymentAttempt } from "../../../../../src/lib/payfastPaymentAttempts";

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
        if (provider.id !== "payfast") return NextResponse.json({ error: "PayFast is not the active billing provider." }, { status: 404 });

        const rawBody = await request.text();
        const events = await provider.verifyWebhook({
            rawBody,
            headers: {
                "x-real-ip": request.headers.get("x-real-ip"),
                "x-forwarded-for": request.headers.get("x-forwarded-for"),
                "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
            },
        });

        const results = [];
        for (const event of events) {
            const metadata = event.metadata ?? {};
            const merchantPaymentId = typeof metadata.m_payment_id === "string" ? metadata.m_payment_id : null;
            const grossAmount = metadata.amount_gross === null || metadata.amount_gross === undefined ? null : amount(metadata.amount_gross);
            const token = event.externalSubscriptionId ?? "";
            const subscription = await findPayFastSubscriptionByToken(token);

            let attempt = merchantPaymentId ? await findBillingPaymentAttempt(merchantPaymentId) : null;
            if (!subscription && !attempt) throw new Error("PayFast ITN could not be matched to a pending payment or subscription.");

            if (event.eventType === "activated") {
                if (!attempt) throw new Error("PayFast initial payment could not be matched to a checkout attempt.");
                if (attempt.user_id !== event.userId || attempt.plan_id === "") throw new Error("PayFast payment identity does not match the checkout attempt.");
                if (grossAmount === null || !closeEnough(grossAmount, Number(attempt.amount))) {
                    throw new Error("PayFast payment amount does not match the recorded checkout amount.");
                }
            }

            if (event.eventType === "provider_synced" && subscription) {
                if (grossAmount !== null) {
                    const expected = Number(subscription.metadata.recurring_amount_zar ?? 0);
                    if (expected > 0 && !closeEnough(grossAmount, expected)) {
                        throw new Error("PayFast recurring payment amount does not match the recorded subscription amount.");
                    }
                }
            }

            if (subscription && event.userId && subscription.user_id !== event.userId) {
                throw new Error("PayFast ITN user identity does not match the existing subscription.");
            }

            const normalizedEvent = subscription && event.eventType === "activated"
                ? { ...event, eventType: "provider_synced" as const, userId: subscription.user_id }
                : subscription && !event.planCode
                    ? { ...event, userId: subscription.user_id }
                    : event;

            const syncResult = await applyNormalizedBillingEvent(normalizedEvent);

            if (attempt) {
                await markBillingPaymentAttempt(attempt.id, {
                    status: event.eventType === "canceled" ? "cancelled" : "complete",
                    externalPaymentId: typeof metadata.pf_payment_id === "string" ? metadata.pf_payment_id : null,
                    externalSubscriptionId: token,
                    metadata: {
                        ...attempt.metadata,
                        last_payment_status: metadata.payment_status ?? null,
                        amount_gross: grossAmount,
                    },
                });
            }

            results.push(syncResult);
        }

        return NextResponse.json({ received: true, processed: results.length, results });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to process PayFast ITN.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
