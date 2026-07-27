import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const ThirdJohn = createBook({
    id: "3JN",
    canonicalName: "Third John",
    shortName: "Third John",
    abbreviation: "3 John",
    canonicalOrder: 64,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 1,
});