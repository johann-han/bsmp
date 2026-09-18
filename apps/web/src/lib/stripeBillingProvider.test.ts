import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { __test__, StripeBillingProvider } from "./stripeBillingProvider";

describe("StripeBillingProvider", () => {
    const saved = {
        secret: process.env.STRIPE_SECRET_KEY,
        webhook: process.env.STRIPE_WEBHOOK_SECRET,
        tolerance: process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS,
    };

    afterEach(() => {
        if (saved.secret === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = saved.secret;
        if (saved.webhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = saved.webhook;
        if (saved.tolerance === undefined) delete process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS; else process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS = saved.tolerance;
        vi.restoreAllMocks();
    });

    it("normalizes plan price environment keys", () => {
        expect(__test__.priceEnvironmentKey("pro-monthly")).toBe("STRIPE_PRICE_PRO_MONTHLY");
    });

    it("maps Stripe subscription statuses", () => {
        expect(__test__.billingStatusFor("unpaid")).toBe("past_due");
        expect(__test__.billingStatusFor("incomplete_expired")).toBe("canceled");
        expect(__test__.eventTypeFor("trialing")).toBe("trial_started");
        expect(__test__.eventTypeFor("active")).toBe("activated");
        expect(__test__.eventTypeFor("past_due")).toBe("past_due");
        expect(__test__.eventTypeFor("paused")).toBe("paused");
    });

    it("verifies a Stripe signature", () => {
        const rawBody = JSON.stringify({ id: "evt_test" });
        const secret = "whsec_test";
        const timestamp = Math.floor(Date.now() / 1000);
        const digest = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
        expect(() => __test__.verifyStripeSignature(rawBody, `t=${timestamp},v1=${digest}`, secret)).not.toThrow();
    });

    it("requires a Stripe webhook secret", async () => {
        delete process.env.STRIPE_WEBHOOK_SECRET;
        await expect(new StripeBillingProvider().verifyWebhook({ rawBody: "{}", headers: { "stripe-signature": "x" } })).rejects.toThrow("STRIPE_WEBHOOK_SECRET is not configured.");
    });
});
