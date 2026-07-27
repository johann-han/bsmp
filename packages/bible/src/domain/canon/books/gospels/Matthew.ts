import { BibleDivision, Testament, } from "../../../classification/index.js";
import { createBook } from "../../../factories/createBook.js";

export const Matthew = createBook({
    id: "MAT",
    canonicalName: "Matthew",
    shortName: "Matth",
    abbreviation: "Matt",
    canonicalOrder: 40,
    testament: Testament.New,
    division: BibleDivision.Gospels,
    chapterCount: 28,
});