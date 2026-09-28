import { describe, expect, it } from "vitest";

import { getAdjacentWordStudyTarget } from "./wordStudyNavigation";

const verses = [
    { number: 16, text: "For I am not ashamed." },
    { number: 17, text: "For therein is the righteousness of God." },
];

describe("Strong's word-study navigation", () => {
    it("moves to the adjacent word in the same verse", () => {
        expect(
            getAdjacentWordStudyTarget(verses, { verseNumber: 16, wordIndex: 2 }, 1),
        ).toEqual({ verseNumber: 16, wordIndex: 3 });
    });

    it("moves forward into the next verse", () => {
        expect(
            getAdjacentWordStudyTarget(verses, { verseNumber: 16, wordIndex: 4 }, 1),
        ).toEqual({ verseNumber: 17, wordIndex: 0 });
    });

    it("moves backward into the previous verse", () => {
        expect(
            getAdjacentWordStudyTarget(verses, { verseNumber: 17, wordIndex: 0 }, -1),
        ).toEqual({ verseNumber: 16, wordIndex: 4 });
    });

    it("returns null at the passage boundaries", () => {
        expect(
            getAdjacentWordStudyTarget(verses, { verseNumber: 16, wordIndex: 0 }, -1),
        ).toBeNull();
        expect(
            getAdjacentWordStudyTarget(verses, { verseNumber: 17, wordIndex: 7 }, 1),
        ).toBeNull();
    });

    it("returns null for an invalid current target", () => {
        expect(
            getAdjacentWordStudyTarget(verses, { verseNumber: 99, wordIndex: 0 }, 1),
        ).toBeNull();
    });
});
