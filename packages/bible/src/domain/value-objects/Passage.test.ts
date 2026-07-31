import { describe, expect, it } from "vitest";
import { BookCode } from "./index.js";
import { ChapterNumber } from "./index.js";
import { VerseNumber } from "./index.js";
import { VerseReference } from "./index.js";
import { Passage } from "./index.js";

describe("Passage", () => {

    describe("create()", () => {

        it("creates a passage", () => {

            // Arrange

            const start = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(1),
            );

            const end = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(5),
            );

            // Act

            const passage = Passage.create(
                start,
                end,
            );

            // Assert

            expect(passage).toBeInstanceOf(Passage);

        });

        it("rejects a passage whose end precedes its start", () => {

            const start = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(5),
            );

            const end = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(1),
            );

            expect(() =>
                Passage.create(start, end),
            ).toThrow();

        });

    });

});