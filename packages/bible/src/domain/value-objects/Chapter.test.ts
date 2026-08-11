import { describe, expect, it } from "vitest";
import { Chapter } from "./Chapter.js";
import { ChapterNumber, } from "./index.js";

describe("Chapter", () => {

    describe("create()", () => {

        it("creates a chapter", () => {

            // Arrange

            const number = ChapterNumber.of(1);

            // Act

            const chapter = Chapter.create(
                number,
                [],
            );

            // Assert

            expect(chapter).toBeInstanceOf(Chapter);

        });

    });

});
