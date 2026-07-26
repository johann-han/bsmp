import { BibleDivision } from "../classification/index.js";
import { Testament } from "../classification/index.js";

import { createBook } from "../factories/createBook.js";

export const PROTESTANT_CANON = [

    createBook({
        id: "GEN",
        canonicalName: "Genesis",
        shortName: "Genesis",
        abbreviation: "Gen",
        canonicalOrder: 1,
        testament: Testament.Old,
        division: BibleDivision.Law,
        chapterCount: 50,
    }),

    createBook({
        id: "EXO",
        canonicalName: "Exodus",
        shortName: "Exodus",
        abbreviation: "Ex",
        canonicalOrder: 2,
        testament: Testament.Old,
        division: BibleDivision.Law,
        chapterCount: 40,
    }),

    createBook({
        id: "LEV",
        canonicalName: "Leviticus",
        shortName: "Leviticus",
        abbreviation: "Lev",
        canonicalOrder: 1,
        testament: Testament.Old,
        division: BibleDivision.Law,
        chapterCount: 27,
    }),

];