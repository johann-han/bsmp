import { describe, expect, it } from "vitest";

import { createQuotaStatus } from "./aiQuota";

describe("AI quota status", () => {
    const periodStart = "2026-09-01T00:00:00.000Z";
    const periodEnd = "2026-10-01T00:00:00.000Z";

    it("enforces a finite count entitlement", () => {
        const status = createQuotaStatus({
            planCode: "starter-monthly",
            planName: "BSMP Starter Monthly",
            limit: 100,
            used: 2,
            periodStart,
            periodEnd,
        });

        expect(status.enforced).toBe(true);
        expect(status.allowed).toBe(true);
        expect(status.limit).toBe(100);
        expect(status.used).toBe(2);
        expect(status.remaining).toBe(98);
        expect(status.reason).toBe("quota_available");
    });

    it("blocks operations when the finite allowance is exhausted", () => {
        const status = createQuotaStatus({
            planCode: "starter-monthly",
            planName: "BSMP Starter Monthly",
            limit: 100,
            used: 100,
            periodStart,
            periodEnd,
        });

        expect(status.enforced).toBe(true);
        expect(status.allowed).toBe(false);
        expect(status.remaining).toBe(0);
        expect(status.reason).toBe("quota_exceeded");
    });

    it("keeps quota enforcement fail-open when no entitlement is configured", () => {
        const status = createQuotaStatus({
            planCode: "starter-monthly",
            planName: "BSMP Starter Monthly",
            limit: null,
            used: 37,
            periodStart,
            periodEnd,
        });

        expect(status.enforced).toBe(false);
        expect(status.allowed).toBe(true);
        expect(status.remaining).toBeNull();
        expect(status.reason).toBe("no_quota");
    });
});
