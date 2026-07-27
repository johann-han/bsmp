import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const SecondKings = createBook({
    id: "2Ki",
    canonicalName: "Second Kings",
    shortName: "Second Kings",
    abbreviation: "2Kgs",
    canonicalOrder: 12,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 25,
});