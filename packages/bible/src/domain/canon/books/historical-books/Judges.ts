import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Judges = createBook({
    id: "JDG",
    canonicalName: "Judges",
    shortName: "Judges",
    abbreviation: "Jdg",
    canonicalOrder: 7,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 21,
});