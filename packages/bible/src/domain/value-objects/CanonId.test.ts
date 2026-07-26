import { describe, expect, it } from "vitest";

import { CanonId } from "./CanonId.js";

describe("CanonId", () => {
    it("creates the Protestant canon", () => {
        expect(CanonId.protestant().value).toBe("protestant");
    });

    it("creates from a string", () => {
        expect(CanonId.from("protestant").value).toBe("protestant");
    });

    it("is case-insensitive", () => {
        expect(CanonId.from("ProTestAnt").value).toBe("protestant");
    });

    it("supports equality", () => {
        expect(
            CanonId.protestant().equals(
                CanonId.from("protestant"),
            ),
        ).toBe(true);
    });

    it("rejects an empty string", () => {
        expect(() => CanonId.from("")).toThrow();
    });

    it("rejects unsupported canon IDs", () => {
        expect(() => CanonId.from("ethiopian")).toThrow();
    });
});