import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Haggai = createBook({
    id: "HAG",
    canonicalName: "Haggai",
    shortName: "Haggai",
    abbreviation: "Hag",
    canonicalOrder: 37,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 2,
});