import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Exodus = createBook({
    id: "EXO",
    canonicalName: "Exodus",
    shortName: "Exodus",
    abbreviation: "Exo",
    canonicalOrder: 2,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 40,
});