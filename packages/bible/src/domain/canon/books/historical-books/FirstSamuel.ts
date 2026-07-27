import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const FirstSamuel = createBook({
    id: "1SA",
    canonicalName: "First Samuel",
    shortName: "First Samuel",
    abbreviation: "1Sam",
    canonicalOrder: 9,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 31,
});