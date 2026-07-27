import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Isaiah = createBook({
    id: "ISA",
    canonicalName: "Isaiah",
    shortName: "Isaiah",
    abbreviation: "Isa",
    canonicalOrder: 23,
    testament: Testament.Old,
    division: BibleDivision.MajorProphets,
    chapterCount: 66,
});