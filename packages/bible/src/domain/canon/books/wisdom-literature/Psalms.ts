import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Psalms = createBook({
    id: "PSA",
    canonicalName: "Psalms",
    shortName: "Psalms",
    abbreviation: "Ps",
    canonicalOrder: 19,
    testament: Testament.Old,
    division: BibleDivision.PoetryAndWisdom,
    chapterCount: 150,
});