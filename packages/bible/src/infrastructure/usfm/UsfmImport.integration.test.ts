import { describe, expect, it } from "vitest";

import { UsfmLexer } from "./lexer/UsfmLexer.js";
import { UsfmParser } from "./parser/UsfmParser.js";
import { BookBuilder } from "./builder/BookBuilder.js";
import { BibleBuilder } from "./builder/BibleBuilder.js";

import { Passage } from "../../domain/value-objects/Passage.js";
import { VerseReference } from "../../domain/value-objects/VerseReference.js";

import {
    BibleMetadata,
    Language,
    Translation,
    BookCode,
    ChapterNumber,
    VerseNumber,
} from "../../domain/value-objects/index.js";
import { UsfmBibleImportService } from "./UsfmBibleImportService.js";

describe("USFM Import Integration", () => {

    it("imports Genesis 1:1", () => {

        const usfm = `
\\id GEN
\\c 1
\\v 1 In the beginning God created the heaven and the earth.
`;

        const lexer = new UsfmLexer();
        const parser = new UsfmParser();
        const bookBuilder = new BookBuilder();
        const bibleBuilder = new BibleBuilder();

        const tokens = lexer.tokenize(usfm);

        const parsedBook = parser.parse(tokens);

        const book = bookBuilder.build(parsedBook);

        const bible = bibleBuilder.build(
            [book],
            BibleMetadata.create({
                displayName: "Test Bible",
                abbreviation: "TB",
            }),
            Language.from("en"),
            Translation.from("TEST"),
        );

        const verse = bible
            .book(BookCode.from("GEN"))
            ?.chapter(ChapterNumber.of(1))
            ?.verse(VerseNumber.from(1));

        expect(verse).toBeDefined();

        expect(
            verse?.text.value,
        ).toBe(
            "In the beginning God created the heaven and the earth.",
        );

        expect(
            verse?.reference.book.value,
        ).toBe("GEN");

        expect(
            verse?.reference.chapter.value,
        ).toBe(1);

        expect(
            verse?.reference.verse.value,
        ).toBe(1);

        const start = VerseReference.create(
            BookCode.from("GEN"),
            ChapterNumber.of(1),
            VerseNumber.from(1),
        );

        const passage = Passage.create(
            start,
            start,
        );

        const verses = bible.read(passage);

        expect(verses).toHaveLength(1);
        expect(verses[0]?.text.value).toBe(
            "In the beginning God created the heaven and the earth.",
        );

    });

});

describe("UsfmBibleImportService", () => {

    it("imports Genesis", () => {

        const usfm = `
\\id GEN
\\c 1
\\v 1 In the beginning God created the heaven and the earth.
`;

        const service =
            new UsfmBibleImportService();

        const book =
            service.importBook(usfm);

        expect(book.code.value)
            .toBe("GEN");

    });

});