import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Ezekiel = createBook({
    id: "EZK",
    canonicalName: "Ezekiel",
    shortName: "Ezek",
    abbreviation: "Ezek",
    canonicalOrder: 26,
    testament: Testament.Old,
    division: BibleDivision.MajorProphets,
    chapterCount: 48,
});