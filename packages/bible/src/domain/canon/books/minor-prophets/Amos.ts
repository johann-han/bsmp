import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Amos = createBook({
    id: "AMO",
    canonicalName: "Amos",
    shortName: "Amos",
    abbreviation: "Amos",
    canonicalOrder: 30,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 9,
});