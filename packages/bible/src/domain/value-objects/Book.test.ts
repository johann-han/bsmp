import { describe, expect, it } from "vitest";
import { VerseNumber } from "./VerseNumber.js";
import {
    Book,
    BookCode,
    BookName,
    Chapter,
    ChapterNumber,
    VerseReference,
    VerseText,
} from "./index.js";
import { Verse } from "./Verse.js";

function createChapter(number: number): Chapter {

    return Chapter.create(
        ChapterNumber.of(number),
        [],
    );

}

function createVerse(number: number): Verse {

    return Verse.create(
        VerseReference.create(
            BookCode.from("GEN"),
            ChapterNumber.of(1),
            VerseNumber.from(number),
        ),
        VerseText.from("Test verse"),
    );

}

describe("Book", () => {

    describe("create()", () => {

        it("creates a book", () => {

            // Arrange

            const code = BookCode.from("GEN");
            const name = BookName.from("Genesis");

            // Act

            const book = Book.create(
                code,
                name,
                [],
            );

            // Assert

            expect(book).toBeInstanceOf(Book);

        });

        it("returns a chapter by number", () => {

            const chapter1 = createChapter(1);

            const book = Book.create(
                BookCode.from("GEN"),
                BookName.from("Genesis"),
                [chapter1],
            );

            expect(
                book.chapter(ChapterNumber.of(1))
            ).toBe(chapter1);

        });

        it("returns a verse by number", () => {

            // Arrange

            const verse1 = createVerse(1);

            const chapter = Chapter.create(
                ChapterNumber.of(1),
                [verse1],
            );

            // Act

            const verse = chapter.verse(
                VerseNumber.from(1),
            );

            // Assert

            expect(verse).toBe(verse1);

        });



    });

});