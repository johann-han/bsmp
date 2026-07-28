import { describe, expect, it } from "vitest";

import { BibleDivision } from "../classification/BibleDivision.js";
import { Testament } from "../classification/Testament.js";

import {
    BibleBookId,
    BookMetadata,
    BookName,
    CanonicalOrder,
    ChapterCount,
} from "../value-objects/index.js";

import { BibleBook } from "./BibleBook.js";

describe("BibleBook", () => {
    function createGenesis(): BibleBook {
        return BibleBook.create(
            BibleBookId.from("GEN"),
            {
                metadata: BookMetadata.create({
                    canonicalName: BookName.from("Genesis"),
                    shortName: BookName.from("Genesis"),
                    abbreviation: BookName.from("Gen"),
                }),
                canonicalOrder: CanonicalOrder.of(1),
                testament: Testament.Old,
                division: BibleDivision.Law,
                chapterCount: ChapterCount.from(50),
            },
        );
    }

    it("creates a Bible book", () => {
        const genesis = createGenesis();

        expect(genesis.id.code).toBe("GEN");
        expect(genesis.metadata.canonicalName.value).toBe("Genesis");
        expect(genesis.metadata.shortName.value).toBe("Genesis");
        expect(genesis.metadata.abbreviation.value).toBe("Gen");
        expect(genesis.canonicalOrder.value).toBe(1);
        expect(genesis.testament).toBe(Testament.Old);
        expect(genesis.division).toBe(BibleDivision.Law);
        expect(genesis.chapterCount.value).toBe(50);
    });

    it("compares equality by identifier", () => {
        const first = createGenesis();
        const second = createGenesis();

        expect(first.equals(second)).toBe(true);
    });
});