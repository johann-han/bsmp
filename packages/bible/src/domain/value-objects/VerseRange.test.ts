import { describe, expect, it } from "vitest";

import {
    BibleBookId,
    BibleReference,
    ChapterNumber,
    VerseNumber,
    VerseRange,
} from "./index.js";

describe("VerseRange", () => {

    function reference(
        verse: number,
    ): BibleReference {

        return BibleReference.create({
            book: BibleBookId.from("GEN"),
            chapter: ChapterNumber.of(1),
            verse: VerseNumber.from(verse),
        });
    }

    it("creates a verse range", () => {

        const range = VerseRange.create({
            start: reference(1),
            end: reference(5),
        });

        expect(range.start.verse.value).toBe(1);
        expect(range.end.verse.value).toBe(5);
    });

    it("supports equality", () => {

        expect(
            VerseRange.create({
                start: reference(1),
                end: reference(5),
            }).equals(
                VerseRange.create({
                    start: reference(1),
                    end: reference(5),
                }),
            ),
        ).toBe(true);
    });

});