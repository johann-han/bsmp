import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Jude = createBook({
    id: "JUD",
    canonicalName: "Jude",
    shortName: "Jude",
    abbreviation: "Jude",
    canonicalOrder: 65,
    testament: Testament.New,
    division: BibleDivision.GeneralEpistles,
    chapterCount: 1,
});