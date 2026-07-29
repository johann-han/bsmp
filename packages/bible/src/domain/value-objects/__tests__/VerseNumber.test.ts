import { describe, expect, it } from "vitest";

import { VerseNumber } from "../VerseNumber.js";

describe("VerseNumber", () => {
    it("creates a valid verse number", () => {
        expect(VerseNumber.from(1).value).toBe(1);
    });

    it("accepts large verse numbers", () => {
        expect(VerseNumber.from(176).value).toBe(176);
    });

    it("rejects zero", () => {
        expect(() => VerseNumber.from(0)).toThrow();
    });

    it("rejects negative values", () => {
        expect(() => VerseNumber.from(-1)).toThrow();
    });

    it("rejects decimal values", () => {
        expect(() => VerseNumber.from(4.2)).toThrow();
    });

    it("supports equality", () => {
        expect(
            VerseNumber.from(15).equals(
                VerseNumber.from(15),
            ),
        ).toBe(true);
    });

    it("serializes to JSON", () => {
        expect(VerseNumber.from(7).toJSON()).toEqual({
            value: 7,
        });
    });

    it("converts to string", () => {
        expect(VerseNumber.from(12).toString()).toBe("12");
    });
});