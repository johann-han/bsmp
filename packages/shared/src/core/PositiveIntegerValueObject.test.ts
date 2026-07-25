import { describe, expect, it } from "vitest";

import { PositiveIntegerValueObject } from "./PositiveIntegerValueObject.js";

class TestInteger extends PositiveIntegerValueObject {
    public static from(value: number): TestInteger {
        return new TestInteger(value);
    }
}

describe("PositiveIntegerValueObject", () => {
    it("accepts positive integers", () => {
        expect(TestInteger.from(5).value).toBe(5);
    });

    it("rejects zero", () => {
        expect(() => TestInteger.from(0)).toThrow();
    });

    it("rejects negative integers", () => {
        expect(() => TestInteger.from(-1)).toThrow();
    });

    it("rejects decimal values", () => {
        expect(TestInteger.from(5).value).toBe(5);
    });
});