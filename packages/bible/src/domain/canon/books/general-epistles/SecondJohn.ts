import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const SecondJohn = createBook({
    id: "2JN",
    canonicalName: "Second John",
    shortName: "Second John",
    abbreviation: "2 John",
    canonicalOrder: 63,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 1,
});