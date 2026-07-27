import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Ecclesiastes = createBook({
    id: "ECC",
    canonicalName: "Ecclesiastes",
    shortName: "Ecclesiastes",
    abbreviation: "Eccl",
    canonicalOrder: 21,
    testament: Testament.Old,
    division: BibleDivision.PoetryAndWisdom,
    chapterCount: 12,
});