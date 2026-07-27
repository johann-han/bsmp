import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const FirstKings = createBook({
    id: "1Ki",
    canonicalName: "First Kings",
    shortName: "First Kings",
    abbreviation: "1Kgs",
    canonicalOrder: 11,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 22,
});