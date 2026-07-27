import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const James = createBook({
    id: "JAS",
    canonicalName: "James",
    shortName: "James",
    abbreviation: "Jas",
    canonicalOrder: 59,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 5,
});