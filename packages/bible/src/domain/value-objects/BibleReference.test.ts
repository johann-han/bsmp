import { describe, expect, it } from "vitest";

import {
    BibleBookId,
    BibleReference,
    ChapterNumber,
    VerseNumber,
} from "./index.js";

describe("BibleReference", () => {
    it("creates a valid Bible reference", () => {
        const reference = BibleReference.create({
            book: BibleBookId.from("GEN"),
            chapter: ChapterNumber.from(1),
            verse: VerseNumber.from(1),
        });

        expect(reference.book.value).toBe("GEN");
        expect(reference.chapter.value).toBe(1);
        expect(reference.verse.value).toBe(1);
    });

    it("supports structural equality", () => {
        const first = BibleReference.create({
            book: BibleBookId.from("GEN"),
            chapter: ChapterNumber.from(1),
            verse: VerseNumber.from(1),
        });

        const second = BibleReference.create({
            book: BibleBookId.from("GEN"),
            chapter: ChapterNumber.from(1),
            verse: VerseNumber.from(1),
        });

        expect(first.equals(second)).toBe(true);
    });

    it("distinguishes different references", () => {
        const first = BibleReference.create({
            book: BibleBookId.from("GEN"),
            chapter: ChapterNumber.from(1),
            verse: VerseNumber.from(1),
        });

        const second = BibleReference.create({
            book: BibleBookId.from("GEN"),
            chapter: ChapterNumber.from(1),
            verse: VerseNumber.from(2),
        });

        expect(first.equals(second)).toBe(false);
    });
});