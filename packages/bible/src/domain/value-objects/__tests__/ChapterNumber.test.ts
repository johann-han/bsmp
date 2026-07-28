import { describe, expect, it } from "vitest";

import {
    ChapterNumber,
    InvalidChapterNumberError,
} from "../ChapterNumber.js";

describe("ChapterNumber", () => {

    it("creates a valid chapter number", () => {
        const chapter = ChapterNumber.of(3);

        expect(chapter.value).toBe(3);
    });

    it("rejects zero", () => {
        expect(() => ChapterNumber.of(0))
            .toThrow(InvalidChapterNumberError);
    });

    it("rejects negatives", () => {
        expect(() => ChapterNumber.of(-1))
            .toThrow(InvalidChapterNumberError);
    });

    it("rejects decimals", () => {
        expect(() => ChapterNumber.of(1.5))
            .toThrow(InvalidChapterNumberError);
    });

    it("rejects NaN", () => {
        expect(() => ChapterNumber.of(Number.NaN))
            .toThrow(InvalidChapterNumberError);
    });

    it("compares equal values", () => {
        expect(
            ChapterNumber.of(5).equals(
                ChapterNumber.of(5)
            )
        ).toBe(true);
    });

    it("compares correctly", () => {
        expect(
            ChapterNumber.of(2).compareTo(
                ChapterNumber.of(5)
            )
        ).toBeLessThan(0);
    });

    it("formats correctly", () => {
        expect(
            ChapterNumber.of(12).toString()
        ).toBe("12");
    });

});