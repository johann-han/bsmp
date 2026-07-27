import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Joel = createBook({
    id: "JOL",
    canonicalName: "Joel",
    shortName: "Joel",
    abbreviation: "Joel",
    canonicalOrder: 29,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 3,
});