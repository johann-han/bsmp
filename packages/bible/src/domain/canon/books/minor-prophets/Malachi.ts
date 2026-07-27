import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Malachi = createBook({
    id: "MAL",
    canonicalName: "Malachi",
    shortName: "Malachi",
    abbreviation: "Mal",
    canonicalOrder: 39,
    testament: Testament.Old,
    division: BibleDivision.MinorProphets,
    chapterCount: 4,
});