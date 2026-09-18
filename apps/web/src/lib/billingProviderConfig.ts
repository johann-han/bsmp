import { normalizeBillingProviderId } from "./billingProvider";

export interface BillingProviderConfiguration {
    readonly configured: boolean;
    readonly providerId: string | null;
}

export function getBillingProviderConfiguration(
    environment: { BILLING_PROVIDER?: string } = process.env,
): BillingProviderConfiguration {
    const rawProvider = environment.BILLING_PROVIDER?.trim();

    if (!rawProvider) {
        return {
            configured: false,
            providerId: null,
        };
    }

    return {
        configured: true,
        providerId: normalizeBillingProviderId(rawProvider),
    };
}
