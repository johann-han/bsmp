import { describe, expect, it } from "vitest";
import { CanonicalOrder } from "../CanonicalOrder.js";

describe("CanonicalOrder", () => {
    it("creates a valid canonical order", () => {
        const order = CanonicalOrder.of(1);

        expect(order.value).toBe(1);
    });

    it("supports equality", () => {
        expect(
            CanonicalOrder.of(5).equals(
                CanonicalOrder.of(5),
            ),
        ).toBe(true);
    });

    it("rejects zero", () => {
        expect(() =>
            CanonicalOrder.of(0),
        ).toThrow("Canonical order must be a positive integer.");
    });

    it("rejects negative values", () => {
        expect(() =>
            CanonicalOrder.of(-1),
        ).toThrow("Canonical order must be a positive integer.");
    });

    it("rejects decimal values", () => {
        expect(() =>
            CanonicalOrder.of(1.5),
        ).toThrow("Canonical order must be a positive integer.");
    });
});