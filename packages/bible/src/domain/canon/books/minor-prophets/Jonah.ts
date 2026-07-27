import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Jonah = createBook({
    id: "JON",
    canonicalName: "Jonah",
    shortName: "Jonah",
    abbreviation: "Jonah",
    canonicalOrder: 32,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 4,
});