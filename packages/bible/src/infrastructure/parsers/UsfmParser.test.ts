import { describe, expect, it } from "vitest";

import { UsfmParser } from "./UsfmParser.js";

describe("UsfmParser", () => {

    it("parses a book identifier", () => {

        // Arrange

        const usfm = `
\\id GEN
`;

        const parser = new UsfmParser();

        // Act

        const book = parser.parse(usfm);

        // Assert

        expect(book.id).toBe("GEN");

    });

});