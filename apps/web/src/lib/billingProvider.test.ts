import { describe, expect, it } from "vitest";

import { normalizeBillingProviderId } from "./billingProvider";

describe("normalizeBillingProviderId", () => {
    it("normalizes provider ids", () => {
        expect(normalizeBillingProviderId("  Stripe_Test ")).toBe("stripe_test");
    });

    it("rejects empty ids", () => {
        expect(() => normalizeBillingProviderId("   ")).toThrow(
            "Billing provider id is required.",
        );
    });

    it("rejects unsupported characters", () => {
        expect(() => normalizeBillingProviderId("provider.example")).toThrow(
            "Billing provider id contains unsupported characters.",
        );
    });
});
