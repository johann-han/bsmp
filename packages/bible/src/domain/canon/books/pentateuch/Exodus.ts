import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Exodus = createBook({
    id: "EX",
    canonicalName: "Exodus",
    shortName: "Exodus",
    abbreviation: "Ex",
    canonicalOrder: 2,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 40,
});