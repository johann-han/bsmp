import "server-only";

import { getBillingProviderConfiguration } from "./billingProviderConfig";
import type { BillingProvider } from "./billingProvider";
import { StripeBillingProvider } from "./stripeBillingProvider";

export function getBillingProvider(): BillingProvider {
    const config = getBillingProviderConfiguration();
    if (!config.configured) {
        throw new Error("Billing is not configured. Set BILLING_PROVIDER on the server.");
    }
    if (config.providerId === "stripe") return new StripeBillingProvider();
    throw new Error(`Unsupported billing provider: ${config.providerId}`);
}
