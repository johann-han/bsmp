import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Hosea = createBook({
    id: "HOS",
    canonicalName: "Hosea",
    shortName: "Hosea",
    abbreviation: "Hos",
    canonicalOrder: 28,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 14,
});