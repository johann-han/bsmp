import { describe, expect, it } from "vitest";

import { UsfmParser } from "./UsfmParser.js";
import { UsfmLexer } from "../lexer/UsfmLexer.js";

describe("UsfmParser", () => {

    it("parses a book identifier", () => {

        // Arrange

        const usfm = `
\\id GEN
`;

        const lexer = new UsfmLexer();
        const parser = new UsfmParser();

        const tokens = lexer.tokenize(usfm);

        const book = parser.parse(tokens);

        // Assert

        expect(book.id).toBe("GEN");

    });

    it("parses a single chapter with one verse", () => {

        // Arrange

        const usfm = `
\\id GEN
\\c 1
\\v 1 In the beginning God created the heaven and the earth.
`;

        const lexer = new UsfmLexer();
        const parser = new UsfmParser();

        const tokens = lexer.tokenize(usfm);

        const book = parser.parse(tokens);

        // Assert

        expect(book).toEqual({
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
        });

    });

});