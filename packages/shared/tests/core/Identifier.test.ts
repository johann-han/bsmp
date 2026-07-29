import { describe, expect, it } from "vitest";

import { Identifier } from "../../src/core/Identifier.js";

class TestIdentifier extends Identifier<string> {
    public constructor(value: string) {
        super(value);
    }
}

describe("Identifier", () => {

    it("stores the identifier value", () => {
        const id = new TestIdentifier("GEN");

        expect(id.value).toBe("GEN");
    });

    it("compares equal identifiers with the same value", () => {
        const left = new TestIdentifier("GEN");
        const right = new TestIdentifier("GEN");

        expect(left.equals(right)).toBe(true);
    });

    it("compares different identifiers correctly", () => {
        const left = new TestIdentifier("GEN");
        const right = new TestIdentifier("EXO");

        expect(left.equals(right)).toBe(false);
    });

    it("serializes correctly", () => {
        const id = new TestIdentifier("GEN");

        expect(id.toJSON()).toEqual({
            value: "GEN",
        });
    });

});