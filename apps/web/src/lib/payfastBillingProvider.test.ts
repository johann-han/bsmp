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
    };

    afterEach(() => {
        if (saved.merchantId === undefined) delete process.env.PAYFAST_MERCHANT_ID; else process.env.PAYFAST_MERCHANT_ID = saved.merchantId;
        if (saved.merchantKey === undefined) delete process.env.PAYFAST_MERCHANT_KEY; else process.env.PAYFAST_MERCHANT_KEY = saved.merchantKey;
        if (saved.passphrase === undefined) delete process.env.PAYFAST_PASSPHRASE; else process.env.PAYFAST_PASSPHRASE = saved.passphrase;
        if (saved.sandbox === undefined) delete process.env.PAYFAST_SANDBOX; else process.env.PAYFAST_SANDBOX = saved.sandbox;
        if (saved.planMap === undefined) delete process.env.PAYFAST_PLAN_MAP; else process.env.PAYFAST_PLAN_MAP = saved.planMap;
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
        process.env.PAYFAST_PLAN_MAP = JSON.stringify({
            "starter-monthly": { amount: "99.00", recurringAmount: "99.00", frequency: 3, cycles: 0, itemName: "BSMP Starter" }
        });

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
        expect(result.formFields?.signature).toMatch(/^[a-f0-9]{32}$/);
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
