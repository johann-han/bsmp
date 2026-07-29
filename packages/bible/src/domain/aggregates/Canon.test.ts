import { describe, expect, it } from "vitest";
import { ValidationError } from "@bsmp/shared";
import { BibleDivision, Testament } from "../classification/index.js";
import { BibleBook } from "../entities/BibleBook.js";

import {
    BibleBookId,
    BookCode,
    BookMetadata,
    BookName,
    CanonId,
    CanonMetadata,
    CanonicalOrder,
    ChapterCount,
} from "../value-objects/index.js";

import { Canon } from "./Canon.js";

describe("Canon", () => {

    function createGenesis(): BibleBook {

        return BibleBook.create(
            BibleBookId.from("GEN"),
            {
                metadata: BookMetadata.create({
                    canonicalName: BookName.from("Genesis"),
                    shortName: BookName.from("Gen"),
                    code: BookCode.from("GEN"),
                }),
                canonicalOrder: CanonicalOrder.of(1),
                testament: Testament.Old,
                division: BibleDivision.Law,
                chapterCount: ChapterCount.from(50),
            },
        );

    }

    // 👇 ADD THIS HERE
    function createExodus(): BibleBook {

        return BibleBook.create(
            BibleBookId.from("EXO"),
            {
                metadata: BookMetadata.create({
                    canonicalName: BookName.from("Exodus"),
                    shortName: BookName.from("Exo"),
                    code: BookCode.from("EXO"),
                }),
                canonicalOrder: CanonicalOrder.of(2),
                testament: Testament.Old,
                division: BibleDivision.Law,
                chapterCount: ChapterCount.from(40),
            },
        );

    }


    function createMetadata(): CanonMetadata {

        return CanonMetadata.create({
            displayName: "Protestant Canon",
            shortName: "Protestant",
            description: "The traditional Protestant canon.",
        });

    }

    describe("create()", () => {

        it("creates a valid canon", () => {

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [createGenesis()],
            );

            expect(canon).toBeDefined();
            expect(canon.bookCount).toBe(1);
            expect(canon.isEmpty).toBe(false);

        });

        it("rejects an empty collection of books", () => {

            expect(() =>
                Canon.create(
                    CanonId.from("protestant"),
                    createMetadata(),
                    [],
                ),
            ).toThrow(ValidationError);

        });

        it("exposes its metadata", () => {

            const metadata = createMetadata();

            const canon = Canon.create(
                CanonId.from("protestant"),
                metadata,
                [createGenesis()],
            );

            expect(canon.metadata).toEqual(metadata);

        });

        it("exposes its books", () => {

            const genesis = createGenesis();

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [genesis],
            );

            expect(canon.books).toHaveLength(1);
            expect(canon.books[0]).toEqual(genesis);

        });

        it("rejects duplicate BibleBookIds", () => {

            const genesis = createGenesis();

            const duplicate = BibleBook.create(
                BibleBookId.from("GEN"), // Same ID
                {
                    metadata: BookMetadata.create({
                        canonicalName: BookName.from("Another Genesis"),
                        shortName: BookName.from("AGen"),
                        code: BookCode.from("AGEN"),
                    }),
                    canonicalOrder: CanonicalOrder.of(2),
                    testament: Testament.Old,
                    division: BibleDivision.Law,
                    chapterCount: ChapterCount.from(1),
                },
            );

            expect(() =>
                Canon.create(
                    CanonId.from("protestant"),
                    createMetadata(),
                    [genesis, duplicate],

                ),
            ).toThrow(ValidationError);

        });

        it("rejects duplicate BookCodes", () => {

            const genesis = createGenesis();

            const duplicate = BibleBook.create(
                BibleBookId.from("EXO"), // Valid and different from GEN
                {
                    metadata: BookMetadata.create({
                        canonicalName: BookName.from("Another Genesis"),
                        shortName: BookName.from("AGen"),
                        code: BookCode.from("GEN"), // Duplicate BookCode
                    }),
                    canonicalOrder: CanonicalOrder.of(2),
                    testament: Testament.Old,
                    division: BibleDivision.Law,
                    chapterCount: ChapterCount.from(1),
                },
            );

            expect(() =>
                Canon.create(
                    CanonId.from("protestant"),
                    createMetadata(),
                    [genesis, duplicate],
                ),
            ).toThrow(ValidationError);

        });

        it("rejects duplicate canonical orders", () => {

            const genesis = createGenesis();

            const duplicate = BibleBook.create(
                BibleBookId.from("EXO"),
                {
                    metadata: BookMetadata.create({
                        canonicalName: BookName.from("Exodus"),
                        shortName: BookName.from("Exo"),
                        code: BookCode.from("EXO"),
                    }),
                    canonicalOrder: CanonicalOrder.of(1), // Same as Genesis
                    testament: Testament.Old,
                    division: BibleDivision.Law,
                    chapterCount: ChapterCount.from(40),
                },
            );

            expect(() =>
                Canon.create(
                    CanonId.from("protestant"),
                    createMetadata(),
                    [genesis, duplicate],
                ),
            ).toThrow(ValidationError);

        });

        it("finds a book by its code", () => {

            const genesis = createGenesis();

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [genesis],
            );

            const result = canon.findBookByCode(
                BookCode.from("GEN"),
            );

            expect(result).toBe(genesis);

        });

        it("returns undefined when a book code does not exist", () => {

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [createGenesis()],
            );

            expect(
                canon.findBookByCode(
                    BookCode.from("EXO"),
                ),
            ).toBeUndefined();

        });

        it("finds a book by its id", () => {

            const genesis = createGenesis();

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [genesis],
            );

            expect(
                canon.findBookById(
                    genesis.id,
                ),
            ).toBe(genesis);

        });

        it("returns undefined when the id does not exist", () => {

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [createGenesis()],
            );

            expect(
                canon.findBookById(
                    BibleBookId.from("EXO"),
                ),
            ).toBeUndefined();

        });

        it("returns the first book", () => {

            const genesis = createGenesis();
            const exodus = createExodus();

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [genesis, exodus],
            );

            expect(canon.firstBook()).toBe(genesis);

        });

        it("returns the last book", () => {

            const genesis = createGenesis();
            const exodus = createExodus();

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [genesis, exodus],
            );

            expect(canon.lastBook()).toBe(exodus);

        });

        it("stores books in canonical order", () => {

            const genesis = createGenesis();
            const exodus = createExodus();

            const canon = Canon.create(
                CanonId.from("protestant"),
                createMetadata(),
                [exodus, genesis], // Deliberately reversed
            );

            expect(canon.firstBook()).toBe(genesis);
            expect(canon.lastBook()).toBe(exodus);

        });

        



    });

});