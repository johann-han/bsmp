import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const FirstChronicles = createBook({
    id: "1CH",
    canonicalName: "First Chronicles",
    shortName: "First Chron",
    abbreviation: "1Chr",
    canonicalOrder: 13,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 29,
});