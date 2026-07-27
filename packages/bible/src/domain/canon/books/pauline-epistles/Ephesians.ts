import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Ephesians = createBook({
    id: "EPH",
    canonicalName: "Ephesians",
    shortName: "Ephesians",
    abbreviation: "Eph",
    canonicalOrder: 49,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 6,
});