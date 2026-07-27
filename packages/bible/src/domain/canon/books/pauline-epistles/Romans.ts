import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Romans = createBook({
    id: "ROM",
    canonicalName: "Romans",
    shortName: "Romans",
    abbreviation: "Rom",
    canonicalOrder: 45,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 16,
});