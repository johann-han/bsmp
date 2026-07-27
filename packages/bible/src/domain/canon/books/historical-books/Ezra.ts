import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Ezra = createBook({
    id: "EZR",
    canonicalName: "Ezra",
    shortName: "Ezra",
    abbreviation: "Ezr",
    canonicalOrder: 15,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 10,
});