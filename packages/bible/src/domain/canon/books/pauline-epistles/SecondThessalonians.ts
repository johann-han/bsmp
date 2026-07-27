import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const SecondThessalonians = createBook({
    id: "2TH",
    canonicalName: "Second Thessalonians",
    shortName: "Second Thess",
    abbreviation: "2 Thess",
    canonicalOrder: 53,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 3,
});