import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const FirstJohn = createBook({
    id: "1JN",
    canonicalName: "First John",
    shortName: "First John",
    abbreviation: "1 John",
    canonicalOrder: 62,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 5,
});