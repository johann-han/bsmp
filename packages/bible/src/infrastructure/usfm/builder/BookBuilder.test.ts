import { describe, expect, it } from "vitest";

import { Book } from "../../../domain/value-objects/Book.js";
import { BookBuilder } from "./BookBuilder.js";
import { ChapterNumber, VerseNumber } from "../../../index.js";

describe("BookBuilder", () => {

    it("builds a Book from a parsed book", () => {

        // Arrange

        const parsed = {
            id: "GEN",
            chapters: [],
        };

        const builder = new BookBuilder();

        // Act

        const book = builder.build(parsed);

        // Assert

        expect(book).toBeDefined();
        expect(book).toBeInstanceOf(Book);

    });

    it("builds a chapter", () => {

        const parsed = {
            id: "GEN",
            chapters: [
                {
                    number: 1,
                    verses: [],
                },
            ],
        };

        const builder = new BookBuilder();

        const book = builder.build(parsed);

        expect(
            book.chapter(
                ChapterNumber.of(1),
            ),
        ).toBeDefined();            

    });

    it("builds a verse", () => {

        const parsed = {
            id: "GEN",
            chapters: [
                {
                    number: 1,
                    verses: [
                        {
                            number: 1,
                            text: "In the beginning God created the heaven and the earth.",
                        },
                    ],
                },
            ],
        };

        const builder = new BookBuilder();

        const book = builder.build(parsed);

        expect(
            book
                .chapter(ChapterNumber.of(1))
                ?.verse(VerseNumber.from(1)),
        ).toBeDefined();

        
    });

});