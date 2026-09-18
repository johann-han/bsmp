import { NextResponse } from "next/server";

import { applyNormalizedBillingEvent } from "../../../../../src/lib/billingSubscriptionSync";
import { getBillingProvider } from "../../../../../src/lib/billingProviderRegistry";

export async function POST(request: Request) {
    try {
        const provider = getBillingProvider();
        if (provider.id !== "stripe") return NextResponse.json({ error: "Stripe billing provider is not active." }, { status: 404 });

        const rawBody = await request.text();
        const signature = request.headers.get("stripe-signature");
        const events = await provider.verifyWebhook({
            rawBody,
            headers: { "stripe-signature": signature },
        });

        const results = [];
        for (const event of events) results.push(await applyNormalizedBillingEvent(event));

        return NextResponse.json({ received: true, processed: results.length, results });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to process Stripe webhook.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
