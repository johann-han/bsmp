import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Ruth = createBook({
    id: "RUT",
    canonicalName: "Ruth",
    shortName: "Ruth",
    abbreviation: "Rth",
    canonicalOrder: 8,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 4,
});