import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Joshua = createBook({
    id: "JOS",
    canonicalName: "Joshua",
    shortName: "Joshua",
    abbreviation: "Josh",
    canonicalOrder: 6,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 24,
});