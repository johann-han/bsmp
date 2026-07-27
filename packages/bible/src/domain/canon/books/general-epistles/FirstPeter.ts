import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const FirstPeter = createBook({
    id: "1PE",
    canonicalName: "First Peter",
    shortName: "First Peter",
    abbreviation: "1 Pet",
    canonicalOrder: 60,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 5,
});