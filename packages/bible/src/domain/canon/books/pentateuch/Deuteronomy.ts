import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Deuteronomy = createBook({
    id: "DEU",
    canonicalName: "Deuteronomy",
    shortName: "Deuteronomy",
    abbreviation: "Deu",
    canonicalOrder: 5,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 34,
});