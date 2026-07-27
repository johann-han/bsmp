import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Philemon = createBook({
    id: "PHM",
    canonicalName: "Philemon",
    shortName: "Philemon",
    abbreviation: "phlm",
    canonicalOrder: 57,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 1,
});