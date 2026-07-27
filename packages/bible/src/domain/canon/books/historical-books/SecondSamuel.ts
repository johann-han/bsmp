import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const SecondSamuel = createBook({
    id: "2SA",
    canonicalName: "Second Samuel",
    shortName: "Second Samuel",
    abbreviation: "2Sam",
    canonicalOrder: 10,
    testament: Testament.Old,
    division: BibleDivision.History,
    chapterCount: 24,
});