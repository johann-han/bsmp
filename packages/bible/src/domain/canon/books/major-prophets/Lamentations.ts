import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Lamentations = createBook({
    id: "LAM",
    canonicalName: "Lamentations",
    shortName: "Lamen",
    abbreviation: "Lam",
    canonicalOrder: 25,
    testament: Testament.Old,
    division: BibleDivision.MajorProphets,
    chapterCount: 5,
});