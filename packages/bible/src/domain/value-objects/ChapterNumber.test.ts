import { describe, expect, it } from "vitest";

import { ChapterNumber } from "./ChapterNumber.js";

describe("ChapterNumber", () => {
    it("creates a valid chapter number", () => {
        expect(ChapterNumber.from(1).value).toBe(1);
    });

    it("accepts large chapter numbers", () => {
        expect(ChapterNumber.from(150).value).toBe(150);
    });

    it("rejects zero", () => {
        expect(() => ChapterNumber.from(0)).toThrow();
    });

    it("rejects negative values", () => {
        expect(() => ChapterNumber.from(-1)).toThrow();
    });

    it("rejects decimal values", () => {
        expect(() => ChapterNumber.from(1.5)).toThrow();
    });

    it("supports equality", () => {
        expect(
            ChapterNumber.from(5).equals(
                ChapterNumber.from(5),
            ),
        ).toBe(true);
    });
});