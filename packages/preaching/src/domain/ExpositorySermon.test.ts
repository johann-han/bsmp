import { describe, expect, it } from "vitest";
import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import {
    ExpositorySermon,
    ExpositorySermonId,
    SermonBigIdea,
    SermonPurpose,
    SermonTitle,
} from "./ExpositorySermon.js";

function john15(): Passage {
    const start = VerseReference.create(
        BookCode.from("JHN"),
        ChapterNumber.create(15),
        VerseNumber.create(1),
    );
    return Passage.create(start, start);
}

describe("ExpositorySermon", () => {
    it("captures the sermon preparation foundation", () => {
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create("sermon-1"),
            SermonTitle.from("Abide in Christ"),
            john15(),
        );

        sermon.defineBigIdea(SermonBigIdea.from("Jesus calls His people to abide in Him."));
        sermon.definePurpose(SermonPurpose.from("Lead the church toward dependent obedience."));
        sermon.addOutlinePoint("Abide in the vine", "Life and fruitfulness come from Christ.");
        sermon.addOutlinePoint("Bear lasting fruit", "Abiding produces visible obedience.");

        expect(sermon.title.value).toBe("Abide in Christ");
        expect(sermon.passage.toString()).toBe("JHN 15:1");
        expect(sermon.bigIdea?.value).toContain("abide in Him");
        expect(sermon.purpose?.value).toContain("dependent obedience");
        expect(sermon.outline).toHaveLength(2);
    });

    it("rejects empty outline content", () => {
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create("sermon-2"),
            SermonTitle.from("Test"),
            john15(),
        );

        expect(() => sermon.addOutlinePoint("", "truth")).toThrow();
        expect(() => sermon.addOutlinePoint("heading", "")).toThrow();
    });
});
