import { describe, expect, it } from "vitest";

import { TokenType } from "./TokenType.js";
import { UsfmLexer } from "./UsfmLexer.js";

describe("UsfmLexer", () => {

    it("tokenizes a book identifier", () => {

        // Arrange

        const usfm = `
\\id GEN
`;

        const lexer = new UsfmLexer();

        // Act

        const tokens = lexer.tokenize(usfm);

        // Assert

        expect(tokens).toEqual([
            {
                type: TokenType.Marker,
                value: "id",
            },
            {
                type: TokenType.Text,
                value: "GEN",
            },
        ]);

    });

    it("tokenizes a chapter marker", () => {

        // Arrange

        const usfm = `
\\c 1
`;

        const lexer = new UsfmLexer();

        // Act

        const tokens = lexer.tokenize(usfm);

        // Assert

        expect(tokens).toEqual([
            {
                type: TokenType.Marker,
                value: "c",
            },
            {
                type: TokenType.Text,
                value: "1",
            },
        ]);

    });

    it("tokenizes a verse", () => {

        // Arrange

        const usfm = `
\\v 1 In the beginning God created the heaven and the earth.
`;

        const lexer = new UsfmLexer();

        // Act

        const tokens = lexer.tokenize(usfm);

        // Assert

        expect(tokens).toEqual([
            {
                type: TokenType.Marker,
                value: "v",
            },
            {
                type: TokenType.Text,
                value: "1 In the beginning God created the heaven and the earth.",
            },
        ]);

    });

});