import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Hebrews = createBook({
    id: "HEB",
    canonicalName: "Hebrews",
    shortName: "Hebrews",
    abbreviation: "Heb",
    canonicalOrder: 58,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 13,
});