import { describe, expect, it } from "vitest";
import { VerseReference } from "./VerseReference.js";

import {
    BookCode,
    ChapterNumber,
    VerseNumber,
} from "./index.js";

describe("VerseReference", () => {

    describe("create()", () => {

        it("creates a verse reference", () => {

            // Arrange

            const book = BookCode.from("GEN");
            const chapter = ChapterNumber.of(1);
            const verse = VerseNumber.from(1);

            // Act

            const reference = VerseReference.create(
                book,
                chapter,
                verse,
            );

            // Assert

            expect(reference).toBeInstanceOf(VerseReference);

        });

    });

    describe("compareTo()", () => {

        it("returns 0 when references are equal", () => {

            const reference = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(1),
            );

            expect(
                reference.compareTo(reference),
            ).toBe(0);

        });

        it("orders verses within the same chapter", () => {

            const first = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(1),
            );

            const second = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(2),
            );

            expect(
                first.compareTo(second),
            ).toBeLessThan(0);

        });

        

    });

    

});