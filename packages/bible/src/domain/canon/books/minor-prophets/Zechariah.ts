import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Zechariah = createBook({
    id: "ZEC",
    canonicalName: "Zechariah",
    shortName: "Zechar",
    abbreviation: "Zech",
    canonicalOrder: 38,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 14,
});