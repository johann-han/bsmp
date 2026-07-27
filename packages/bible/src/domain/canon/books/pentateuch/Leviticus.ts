import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Leviticus = createBook({
    id: "LEV",
    canonicalName: "Leviticus",
    shortName: "Leviticus",
    abbreviation: "Lev",
    canonicalOrder: 3,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 27,
});