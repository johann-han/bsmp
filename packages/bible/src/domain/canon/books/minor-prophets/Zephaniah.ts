import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Zephaniah = createBook({
    id: "ZEP",
    canonicalName: "Zephaniah",
    shortName: "Zephan",
    abbreviation: "Zeph",
    canonicalOrder: 36,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 3,
});