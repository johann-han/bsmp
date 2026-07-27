import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const FirstThessalonians = createBook({
    id: "1TH",
    canonicalName: "First Thessalonians",
    shortName: "First Thess",
    abbreviation: "1 Thess",
    canonicalOrder: 52,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 5,
});