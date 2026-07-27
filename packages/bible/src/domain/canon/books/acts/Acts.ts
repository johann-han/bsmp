import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Acts = createBook({
    id: "ACT",
    canonicalName: "Acts",
    shortName: "Acts",
    abbreviation: "Acts",
    canonicalOrder: 44,
    testament: Testament.New,
    division: BibleDivision.History,
    chapterCount: 28,
});