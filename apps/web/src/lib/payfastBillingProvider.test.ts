import { afterEach, describe, expect, it, vi } from "vitest";

import { __test__, PayFastBillingProvider } from "./payfastBillingProvider";
import { __test__ as itnTest } from "./payfastItn";

describe("PayFastBillingProvider", () => {
    const saved = {
        merchantId: process.env.PAYFAST_MERCHANT_ID,
        merchantKey: process.env.PAYFAST_MERCHANT_KEY,
        passphrase: process.env.PAYFAST_PASSPHRASE,
        sandbox: process.env.PAYFAST_SANDBOX,
        planMap: process.env.PAYFAST_PLAN_MAP,
        planConfig: process.env.PAYFAST_PLAN_CONFIG,
        publicAppUrl: process.env.PUBLIC_APP_URL,
    };

    afterEach(() => {
        if (saved.merchantId === undefined) delete process.env.PAYFAST_MERCHANT_ID; else process.env.PAYFAST_MERCHANT_ID = saved.merchantId;
        if (saved.merchantKey === undefined) delete process.env.PAYFAST_MERCHANT_KEY; else process.env.PAYFAST_MERCHANT_KEY = saved.merchantKey;
        if (saved.passphrase === undefined) delete process.env.PAYFAST_PASSPHRASE; else process.env.PAYFAST_PASSPHRASE = saved.passphrase;
        if (saved.sandbox === undefined) delete process.env.PAYFAST_SANDBOX; else process.env.PAYFAST_SANDBOX = saved.sandbox;
        if (saved.planMap === undefined) delete process.env.PAYFAST_PLAN_MAP; else process.env.PAYFAST_PLAN_MAP = saved.planMap;
        if (saved.planConfig === undefined) delete process.env.PAYFAST_PLAN_CONFIG; else process.env.PAYFAST_PLAN_CONFIG = saved.planConfig;
        if (saved.publicAppUrl === undefined) delete process.env.PUBLIC_APP_URL; else process.env.PUBLIC_APP_URL = saved.publicAppUrl;
        vi.restoreAllMocks();
    });

    it("generates PHP-style URL encoding", () => {
        expect(__test__.phpUrlEncode("John Doe")).toBe("John+Doe");
    });

    it("preserves checkout field order and appends the passphrase", () => {
        const values = { a: "A", b: "B" };
        expect(__test__.generateSignature(values, "salt", ["a", "b"])).toMatch(/^[a-f0-9]{32}$/);
    });

    it("builds an indefinite monthly PayFast subscription form", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_MERCHANT_KEY = "merchant_key";
        process.env.PAYFAST_PASSPHRASE = "passphrase";
        process.env.PAYFAST_PLAN_CONFIG = JSON.stringify({
            "starter-monthly": { amount: 99.0, recurringAmount: 99.0, frequency: 3, cycles: 0, itemName: "BSMP Starter" }
        });
        process.env.PUBLIC_APP_URL = "https://bsmp.example.com";

        const result = await new PayFastBillingProvider().createCheckoutSession({
            userId: "user-1",
            planCode: "starter-monthly",
            paymentReference: "payment-1",
            customerEmail: "john.doe@example.com",
            successUrl: "https://example.com/success",
            cancelUrl: "https://example.com/cancel",
        });

        expect(result.checkoutMethod).toBe("POST");
        expect(result.currency).toBe("ZAR");
        expect(result.amount).toBe("99.00");
        expect(result.formFields?.subscription_type).toBe("1");
        expect(result.formFields?.frequency).toBe("3");
        expect(result.formFields?.cycles).toBe("0");
        expect(result.formFields?.m_payment_id).toBe("payment-1");
        expect(result.formFields?.notify_url).toBe("https://bsmp.example.com/api/billing/webhooks/payfast");
        expect(result.formFields?.signature).toMatch(/^[a-f0-9]{32}$/);
    });

    it("accepts only VALID from the PayFast server confirmation endpoint", async () => {
        process.env.PAYFAST_PASSPHRASE = "passphrase";
        process.env.PAYFAST_SANDBOX = "true";

        const fetchMock = vi.spyOn(globalThis, "fetch");

        fetchMock.mockResolvedValueOnce(new Response("VALID", { status: 200 }));
        await expect(payFastValidateServerConfirmation({
            m_payment_id: "payment-1",
            pf_payment_id: "3401531",
            payment_status: "COMPLETE",
        })).resolves.toBe(true);

        fetchMock.mockResolvedValueOnce(new Response("INVALID", { status: 200 }));
        await expect(payFastValidateServerConfirmation({
            m_payment_id: "payment-1",
            pf_payment_id: "3401531",
            payment_status: "COMPLETE",
        })).resolves.toBe(false);
    });

    it("builds the PayFast API signature with the authentication credential in sorted order", () => {
        const values = {
            "merchant-id": "10000100",
            timestamp: "2026-09-23T15:00:00+00:00",
            version: "v1",
        };

        expect(__test__.apiSignature(values, "unit-value")).toBe("c52b97bd44c492ce148b1563d61cda9e");
    });

    it("cancels a PayFast subscription through the recurring billing API", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_PASSPHRASE = "passphrase";
        process.env.PAYFAST_SANDBOX = "true";

        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ code: 200, status: "success", data: { response: true } }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await new PayFastBillingProvider().cancelSubscription({
            externalSubscriptionId: "subscription-token",
            cancelAtPeriodEnd: false,
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0]!;
        expect(url).toBe("https://api.payfast.co.za/subscriptions/subscription-token/cancel?testing=true");
        expect(init?.method).toBe("PUT");
        expect(init?.headers).toMatchObject({
            "merchant-id": "10000100",
            version: "v1",
            timestamp: expect.stringMatching(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\+00:00$/),
            signature: expect.stringMatching(/^[a-f0-9]{32}$/),
        });
    });

    it("verifies a recurring ITN with blank optional fields in received order", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_PASSPHRASE = "passphrase";

        const values: Record<string, string> = {
            m_payment_id: "payment-1",
            pf_payment_id: "3401531",
            payment_status: "COMPLETE",
            item_name: "starter-monthly",
            item_description: "BSMP starter-monthly subscription",
            amount_gross: "99.00",
            amount_fee: "-2.30",
            amount_net: "96.70",
            custom_str1: "",
            custom_str2: "",
            custom_str3: "",
            custom_str4: "",
            custom_str5: "",
            custom_int1: "",
            custom_int2: "",
            custom_int3: "",
            custom_int4: "",
            custom_int5: "",
            name_first: "johannhanekom",
            name_last: "User",
            email_address: "john@example.com",
            merchant_id: "10000100",
            token: "subscription-token",
            billing_date: "2026-09-21",
        };
        values.signature = __test__.generateItnSignature(values, "passphrase", Object.keys(values));

        const event = await new PayFastBillingProvider().verifyWebhook({
            rawBody: new URLSearchParams(values).toString(),
            headers: {},
        });

        expect(event).toHaveLength(1);
        expect(event[0]).toMatchObject({
            provider: "payfast",
            externalEventId: "3401531",
            externalSubscriptionId: "subscription-token",
            eventType: "activated",
            status: "active",
        });
    });

    it("normalizes a cancellation ITN to a canceled subscription event", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_PASSPHRASE = "passphrase";

        const values: Record<string, string> = {
            m_payment_id: "payment-1",
            pf_payment_id: "3401532",
            payment_status: "CANCELLED",
            item_name: "starter-monthly",
            item_description: "BSMP starter-monthly subscription",
            amount_gross: "99.00",
            amount_fee: "0.00",
            amount_net: "99.00",
            merchant_id: "10000100",
            token: "subscription-token",
            billing_date: "2026-09-21",
        };
        values.signature = __test__.generateItnSignature(values, "passphrase", Object.keys(values));

        const event = await new PayFastBillingProvider().verifyWebhook({
            rawBody: new URLSearchParams(values).toString(),
            headers: {},
        });

        expect(event).toHaveLength(1);
        expect(event[0]).toMatchObject({
            externalEventId: "3401532",
            externalSubscriptionId: "subscription-token",
            eventType: "canceled",
            status: "canceled",
        });
    });

    it("treats an already-cancelled PayFast subscription as an idempotent success", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_PASSPHRASE = "passphrase";
        process.env.PAYFAST_SANDBOX = "true";

        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({
                code: 400,
                status: "failed",
                data: {
                    response: false,
                    message: "Failure - The subscription status is cancelled",
                },
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await expect(new PayFastBillingProvider().cancelSubscription({
            externalSubscriptionId: "subscription-token",
            cancelAtPeriodEnd: false,
        })).resolves.toBeUndefined();
    });

    it("does not treat an unsuccessful PayFast API response as a cancellation", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_PASSPHRASE = "passphrase";
        process.env.PAYFAST_SANDBOX = "true";

        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ code: 200, status: "success", data: { response: false } }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        await expect(new PayFastBillingProvider().cancelSubscription({
            externalSubscriptionId: "subscription-token",
            cancelAtPeriodEnd: false,
        })).rejects.toThrow("was not confirmed");
    });

    it("rejects recurring plans below PayFast minimum", async () => {
        process.env.PAYFAST_MERCHANT_ID = "10000100";
        process.env.PAYFAST_MERCHANT_KEY = "merchant_key";
        process.env.PAYFAST_PASSPHRASE = "passphrase";
        process.env.PAYFAST_PLAN_MAP = JSON.stringify({
            "starter-monthly": { amount: "4.99", recurringAmount: "4.99", frequency: 3, cycles: 0 }
        });

        await expect(new PayFastBillingProvider().createCheckoutSession({
            userId: "user-1",
            planCode: "starter-monthly",
            paymentReference: "payment-1",
            customerEmail: "john@example.com",
            successUrl: "https://example.com/success",
            cancelUrl: "https://example.com/cancel",
        })).rejects.toThrow("must be at least R5.00");
    });
});

describe("PayFast ITN source validation helpers", () => {
    it("matches an IPv4 CIDR", () => {
        expect(itnTest.matchesCidr("197.97.145.144", "197.97.145.144/28")).toBe(true);
        expect(itnTest.matchesCidr("197.97.145.160", "197.97.145.144/28")).toBe(false);
    });
});
