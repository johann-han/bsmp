import { describe, expect, it } from "vitest";

import { ChapterCount } from "../ChapterCount.js";

describe("ChapterCount", () => {
    it("creates a valid chapter count", () => {
        expect(ChapterCount.from(50).value).toBe(50);
    });

    it("accepts a single chapter", () => {
        expect(ChapterCount.from(1).value).toBe(1);
    });

    it("rejects zero", () => {
        expect(() => ChapterCount.from(0)).toThrow();
    });

    it("rejects negative values", () => {
        expect(() => ChapterCount.from(-5)).toThrow();
    });

    it("rejects decimal values", () => {
        expect(() => ChapterCount.from(3.5)).toThrow();
    });

    it("supports equality", () => {
        expect(
            ChapterCount.from(150).equals(
                ChapterCount.from(150),
            ),
        ).toBe(true);
    });

    it("serializes to JSON", () => {
        expect(ChapterCount.from(66).toJSON()).toEqual({
            value: 66,
        });
    });

    it("converts to string", () => {
        expect(ChapterCount.from(21).toString()).toBe("21");
    });
});