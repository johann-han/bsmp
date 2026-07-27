import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Daniel = createBook({
    id: "DAN",
    canonicalName: "Daniel",
    shortName: "Daniel",
    abbreviation: "Dan",
    canonicalOrder: 27,
    testament: Testament.Old,
    division: BibleDivision.MajorProphets,
    chapterCount: 12,
});