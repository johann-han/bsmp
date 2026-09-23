import { describe, expect, it } from "vitest";

import { getBillingProviderConfiguration } from "./billingProviderConfig";

describe("getBillingProviderConfiguration", () => {
    it("reports billing as unconfigured when no provider is set", () => {
        expect(getBillingProviderConfiguration({})).toEqual({
            configured: false,
            providerId: null,
        });
    });

    it("normalizes the configured provider id", () => {
        expect(getBillingProviderConfiguration({ BILLING_PROVIDER: "  Stripe_Test " })).toEqual({
            configured: true,
            providerId: "stripe_test",
        });
    });
});
