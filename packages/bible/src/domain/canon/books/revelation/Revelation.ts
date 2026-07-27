import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Revelation = createBook({
    id: "REV",
    canonicalName: "Revelation",
    shortName: "Revelation",
    abbreviation: "Rev",
    canonicalOrder: 66,
    testament: Testament.New,
    division: BibleDivision.Apocalypse,
    chapterCount: 22,
});