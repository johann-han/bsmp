import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Galatians = createBook({
    id: "GAL",
    canonicalName: "Galatians",
    shortName: "Galatians",
    abbreviation: "Gal",
    canonicalOrder: 48,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 6,
});