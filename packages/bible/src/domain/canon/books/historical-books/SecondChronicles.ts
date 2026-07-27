import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const SecondChronicles = createBook({
    id: "2CH",
    canonicalName: "Second Chronicles",
    shortName: "Second Chron",
    abbreviation: "2Chr",
    canonicalOrder: 14,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 36,
});