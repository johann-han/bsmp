import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Numbers = createBook({
    id: "NUM",
    canonicalName: "Numbers",
    shortName: "Numbers",
    abbreviation: "Num",
    canonicalOrder: 4,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 36,
});