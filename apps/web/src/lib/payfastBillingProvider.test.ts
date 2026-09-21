import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { __test__ } from "./payfastBillingProvider";

describe("PayFast billing provider", () => {
    it("generates the documented MD5 form signature", () => {
        const fields: Array<[string, string]> = [
            ["merchant_id", "10000100"],
            ["merchant_key", "46f0cd694581a"],
            ["amount", "100.00"],
            ["item_name", "Test Product"],
        ];
        const raw = fields.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&") + "&passphrase=jt7NOE43FZPn";
        const expected = createHash("md5").update(raw).digest("hex");
        expect(__test__.generateSignature(fields, "jt7NOE43FZPn")).toBe(expected);
    });

    it("accepts the current PayFast published IPv4 ranges", () => {
        expect(__test__.ipAllowed("197.97.145.150", "197.97.145.144/28")).toBe(true);
        expect(__test__.ipAllowed("41.74.179.220", "41.74.179.192/27")).toBe(true);
        expect(__test__.ipAllowed("192.0.2.10", "197.97.145.144/28")).toBe(false);
    });

    it("normalizes PayFast payment statuses", () => {
        expect(__test__.normalizeStatus("COMPLETE")).toEqual({ eventType: "activated", status: "active" });
        expect(__test__.normalizeStatus("CANCELLED")).toEqual({ eventType: "canceled", status: "canceled" });
    });
});
