import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const SecondPeter = createBook({
    id: "2PE",
    canonicalName: "Second Peter",
    shortName: "Second Peter",
    abbreviation: "2 Pet",
    canonicalOrder: 61,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 3,
});