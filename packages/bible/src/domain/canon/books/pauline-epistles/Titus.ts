import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Titus = createBook({
    id: "TIT",
    canonicalName: "Titus",
    shortName: "Titus",
    abbreviation: "Titus",
    canonicalOrder: 56,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 3,
});