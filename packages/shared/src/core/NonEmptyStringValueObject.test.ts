import { describe, expect, it } from "vitest";

import { NonEmptyStringValueObject } from "./NonEmptyStringValueObject.js";

class TestString extends NonEmptyStringValueObject {
    public static from(value: string): TestString {
        return new TestString(value);
    }
}

describe("NonEmptyStringValueObject", () => {
    it("accepts valid strings", () => {
        expect(TestString.from("Genesis").value)
            .toBe("Genesis");
    });

    it("trims whitespace", () => {
        expect(TestString.from("  Genesis  ").value)
            .toBe("Genesis");
    });

    it("rejects an empty string", () => {
        expect(() => TestString.from(""))
            .toThrow();
    });

    it("rejects whitespace only", () => {
        expect(() => TestString.from("   "))
            .toThrow();
    });

    it("supports equality", () => {
        expect(
            TestString.from("Genesis")
                .equals(TestString.from("Genesis"))
        ).toBe(true);
    });

    it("serializes correctly", () => {
        expect(TestString.from("Genesis").toJSON())
            .toBe("Genesis");
    });
});