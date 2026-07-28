import { describe, expect, it } from "vitest";
import { CanonicalOrder } from "./CanonicalOrder.js";

describe("CanonicalOrder", () => {
    it("creates a valid canonical order", () => {
        const order = CanonicalOrder.from(1);

        expect(order.value).toBe(1);
    });

    it("supports equality", () => {
        expect(
            CanonicalOrder.from(5).equals(
                CanonicalOrder.from(5),
            ),
        ).toBe(true);
    });

    it("rejects zero", () => {
        expect(() =>
            CanonicalOrder.from(0),
        ).toThrow("Canonical order must be a positive integer.");
    });

    it("rejects negative values", () => {
        expect(() =>
            CanonicalOrder.from(-1),
        ).toThrow("Canonical order must be a positive integer.");
    });

    it("rejects decimal values", () => {
        expect(() =>
            CanonicalOrder.from(1.5),
        ).toThrow("Canonical order must be a positive integer.");
    });
});