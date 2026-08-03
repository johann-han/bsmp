import { describe, expect, it } from "vitest";

import { Bible } from "../../../domain/aggregates/Bible.js";

import {
    BibleMetadata,
    Book,
    BookCode,
    BookName,
    Language,
    Translation,
} from "../../../domain/value-objects/index.js";

import { BibleBuilder } from "./BibleBuilder.js";

describe("BibleBuilder", () => {

    it("builds a Bible from books", () => {

        // Arrange

        const book = Book.create(
            BookCode.from("GEN"),
            BookName.from("Genesis"),
            [],
        );

        const builder = new BibleBuilder();

        // Act

        const bible = builder.build(
            [book],
            BibleMetadata.create({
                displayName: "King James Version",
                abbreviation: "KJV",
            }),
            Language.from("en"),
            Translation.from("KJV"),
        );

        // Assert

        expect(bible).toBeInstanceOf(Bible);

    });

});