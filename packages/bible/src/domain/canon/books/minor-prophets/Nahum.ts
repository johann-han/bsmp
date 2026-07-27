import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Nahum = createBook({
    id: "NAM",
    canonicalName: "Nahum",
    shortName: "Nahum",
    abbreviation: "Nah",
    canonicalOrder: 34,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 3,
});