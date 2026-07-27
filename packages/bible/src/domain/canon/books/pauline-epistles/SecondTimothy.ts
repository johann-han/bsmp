import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const SecondTimothy = createBook({
    id: "2TI",
    canonicalName: "Second Timothy",
    shortName: "Second Timothy",
    abbreviation: "2 Tim",
    canonicalOrder: 55,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 4,
});