import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Jeremiah = createBook({
    id: "JER",
    canonicalName: "Jeremiah",
    shortName: "Jerem",
    abbreviation: "Jer",
    canonicalOrder: 24,
    testament: Testament.Old,
    division: BibleDivision.MajorProphets,
    chapterCount: 52,
});