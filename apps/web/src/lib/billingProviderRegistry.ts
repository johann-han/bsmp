import { getBillingProviderConfiguration } from "./billingProviderConfig";
import type { BillingProvider } from "./billingProvider";
import { PayFastBillingProvider } from "./payfastBillingProvider";

export function getBillingProvider(): BillingProvider {
    const config = getBillingProviderConfiguration();
    if (!config.configured) {
        throw new Error("Billing is not configured. Set BILLING_PROVIDER on the server.");
    }
    if (config.providerId === "payfast") return new PayFastBillingProvider();
    throw new Error(`Unsupported billing provider: ${config.providerId}`);
}
