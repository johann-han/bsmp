import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const John = createBook({
    id: "JHN",
    canonicalName: "John",
    shortName: "John",
    abbreviation: "John",
    canonicalOrder: 43,
    testament: Testament.New,
    division: BibleDivision.Gospels,
    chapterCount: 21,
});