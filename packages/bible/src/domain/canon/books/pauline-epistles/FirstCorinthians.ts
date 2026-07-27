import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const FirstCorinthians = createBook({
    id: "1CO",
    canonicalName: "First Corinthians",
    shortName: "First Corinth",
    abbreviation: "1 Cor",
    canonicalOrder: 46,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 16,
});