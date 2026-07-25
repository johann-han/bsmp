import { BibleDivision } from "../classification/index.js";
import { Testament } from "../classification/index.js";

import { createBook } from "./createBook.js";

export const PROTESTANT_CANON = [

    createBook({
        id: "GEN",
        canonicalName: "Genesis",
        shortName: "Genesis",
        abbreviation: "Gen",
        testament: Testament.Old,
        division: BibleDivision.Law,
        chapterCount: 50,
    }),

    createBook({
        id: "EXO",
        canonicalName: "Exodus",
        shortName: "Exodus",
        abbreviation: "Ex",
        testament: Testament.Old,
        division: BibleDivision.Law,
        chapterCount: 40,
    }),

    createBook({
        id: "LEV",
        canonicalName: "Leviticus",
        shortName: "Leviticus",
        abbreviation: "Lev",
        testament: Testament.Old,
        division: BibleDivision.Law,
        chapterCount: 27,
    }),

];