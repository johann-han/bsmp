import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Mark = createBook({
    id: "MRK",
    canonicalName: "Mark",
    shortName: "Mark",
    abbreviation: "Mark",
    canonicalOrder: 41,
    testament: Testament.New,
    division: BibleDivision.Gospels,
    chapterCount: 16,
});