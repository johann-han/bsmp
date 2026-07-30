import { describe, expect, it } from "vitest";
import { Verse } from "./Verse.js";

import {
    VerseReference,
    VerseText,
    BookCode,
    ChapterNumber,
    VerseNumber,
} from "./index.js";

function createReference(): VerseReference {

    return VerseReference.create(
        BookCode.from("GEN"),
        ChapterNumber.of(1),
        VerseNumber.from(1),
    );

}

function createText(): VerseText {

    return VerseText.from(
        "In the beginning God created the heaven and the earth.",
    );

}

describe("Verse", () => {

    describe("create()", () => {

        it("creates a verse", () => {

            // Arrange

            const reference = createReference();
            const text = createText();

            // Act

            const verse = Verse.create(
                reference,
                text,
            );

            // Assert

            expect(verse).toBeInstanceOf(Verse);

        });

    });

});