import { describe, expect, it } from "vitest";

import { BibleDivision } from "../classification/BibleDivision.js";

describe("BibleDivision", () => {
    it("contains all Protestant divisions", () => {
        expect(Object.values(BibleDivision)).toEqual([
            "LAW",
            "HISTORY",
            "POETRY_AND_WISDOM",
            "MAJOR_PROPHETS",
            "MINOR_PROPHETS",
            "GOSPELS",
            "PAULINE_EPISTLES",
            "GENERAL_EPISTLES",
            "APOCALYPSE",
        ]);
    });

    it("contains exactly nine divisions", () => {
        expect(Object.values(BibleDivision)).toHaveLength(9);
    });
});