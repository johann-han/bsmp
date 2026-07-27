import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const FirstTimothy = createBook({
    id: "1TI",
    canonicalName: "First Timothy",
    shortName: "First Timothy",
    abbreviation: "1 Tim",
    canonicalOrder: 54,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 6,
});