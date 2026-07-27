import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const SecondCorinthians = createBook({
    id: "2CO",
    canonicalName: "Second Corinthians",
    shortName: "Second Corinth",
    abbreviation: "2 Cor",
    canonicalOrder: 47,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 13,
});