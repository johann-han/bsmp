import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Philippians = createBook({
    id: "PHP",
    canonicalName: "Philippians",
    shortName: "Philippians",
    abbreviation: "Phil",
    canonicalOrder: 50,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 4,
});