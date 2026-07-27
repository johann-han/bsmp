import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Deuteronomy = createBook({
    id: "DEUT",
    canonicalName: "Deuteronomy",
    shortName: "Deuteronomy",
    abbreviation: "Deut",
    canonicalOrder: 5,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 34,
});