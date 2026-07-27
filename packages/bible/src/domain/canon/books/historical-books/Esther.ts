import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Esther = createBook({
    id: "EST",
    canonicalName: "Esther",
    shortName: "Esther",
    abbreviation: "Esth",
    canonicalOrder: 17,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 10,
});