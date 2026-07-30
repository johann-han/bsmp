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

});