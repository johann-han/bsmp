import { describe, expect, it } from "vitest";

import { UsfmBibleImportService } from "./UsfmBibleImportService.js";
import { NodeFileSystem } from "../files/NodeFileSystem.js";
import { BookCode, ChapterNumber, VerseNumber } from "../../index.js";

describe("UsfmBibleImportService", () => {

    it("imports a book from USFM text", () => {

        const usfm = `
\\id GEN
\\c 1
\\v 1 In the beginning God created the heaven and the earth.
`;

        const importer =
            new UsfmBibleImportService();

        const book =
            importer.importBook(usfm);

        expect(book.code.value)
            .toBe("GEN");

    });

    it("imports a book from a USFM file", async () => {

        const fileSystem = new NodeFileSystem();

        const usfm = await fileSystem.readFile(
            "test/resources/KJV/GEN.usfm",
        );

        const importer = new UsfmBibleImportService();

        const book = importer.importBook(usfm);

        expect(book.code.value).toBe("GEN");

        expect(
            book.chapter(
                ChapterNumber.of(1),
            ),
        ).toBeDefined();

        expect(
            book
                .chapter(ChapterNumber.of(1))
                ?.verse(VerseNumber.from(1))
                ?.text
                .value,
        ).toContain(
            "In the beginning",
        );

    });

    it("imports a Bible from a folder", async () => {

        const importer = new UsfmBibleImportService();

        const bible = await importer.importBible(
            "test/resources/KJV",
        );

        expect(
            bible.book(
                BookCode.from("GEN"),
            ),
        ).toBeDefined();

    });

});