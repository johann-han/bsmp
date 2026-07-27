import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Proverbs = createBook({
    id: "PRO",
    canonicalName: "Proverbs",
    shortName: "Proverbs",
    abbreviation: "Prov",
    canonicalOrder: 20,
    testament: Testament.Old,
    division: BibleDivision.PoetryAndWisdom,
    chapterCount: 31,
});