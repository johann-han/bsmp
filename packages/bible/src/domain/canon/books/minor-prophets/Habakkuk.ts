import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Habakkuk = createBook({
    id: "HAB",
    canonicalName: "Habakkuk",
    shortName: "Habakkuk",
    abbreviation: "Hab",
    canonicalOrder: 35,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 3,
});