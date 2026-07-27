import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Micah = createBook({
    id: "MIC",
    canonicalName: "Micah",
    shortName: "Micah",
    abbreviation: "Mic",
    canonicalOrder: 33,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 7,
});