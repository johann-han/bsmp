import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Nehemiah = createBook({
    id: "NEH",
    canonicalName: "Nehemiah",
    shortName: "Nehem",
    abbreviation: "Neh",
    canonicalOrder: 16,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 13,
});