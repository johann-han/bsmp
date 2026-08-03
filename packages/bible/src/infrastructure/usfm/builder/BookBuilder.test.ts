import { describe, expect, it } from "vitest";

import { Book } from "../../../domain/value-objects/Book.js";
import { BookBuilder } from "./BookBuilder.js";

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

});