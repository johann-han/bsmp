import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Obadiah = createBook({
    id: "OBA",
    canonicalName: "Obadiah",
    shortName: "Obadiah",
    abbreviation: "Obad",
    canonicalOrder: 31,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 1,
});