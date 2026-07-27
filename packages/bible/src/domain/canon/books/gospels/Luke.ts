import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Luke = createBook({
    id: "LUK",
    canonicalName: "Luke",
    shortName: "Luke",
    abbreviation: "Luke",
    canonicalOrder: 42,
    testament: Testament.New,
    division: BibleDivision.Gospels,
    chapterCount: 24,
});