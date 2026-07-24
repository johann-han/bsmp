import { describe, expect, it } from "vitest";

import { BibleBookId } from "./BibleBookId.js";

describe("BibleBookId", () => {
    it("creates a valid identifier", () => {
        const id = BibleBookId.from("GEN");

        expect(id.code).toBe("GEN");
    });

    it("normalizes lowercase values", () => {
        expect(
            BibleBookId.from("gen").code,
        ).toBe("GEN");
    });

    it("returns cached instances", () => {
        const a = BibleBookId.from("GEN");
        const b = BibleBookId.from("GEN");

        expect(a).toBe(b);
    });

    it("throws for invalid codes", () => {
        expect(() =>
            BibleBookId.from("ABC"),
        ).toThrow();
    });

    it("throws for empty strings", () => {
        expect(() =>
            BibleBookId.from(""),
        ).toThrow();
    });
});