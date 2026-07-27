import {
    BibleDivision,
    Testament,
} from "../../classification/index.js";

import { createBook } from "../../factories/createBook.js";

export const Genesis = createBook({
    id: "GEN",
    canonicalName: "Genesis",
    shortName: "Genesis",
    abbreviation: "Gen",
    canonicalOrder: 1,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 50,
});

export const Exodus = createBook({
    id: "EXO",
    canonicalName: "Exodus",
    shortName: "Exodus",
    abbreviation: "Ex",
    canonicalOrder: 2,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 40,
});

export const Leviticus = createBook({
    id: "LEV",
    canonicalName: "Leviticus",
    shortName: "Leviticus",
    abbreviation: "Lev",
    canonicalOrder: 3,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 27,
});

export const Numbers = createBook({
    id: "NUM",
    canonicalName: "Numbers",
    shortName: "Numbers",
    abbreviation: "Num",
    canonicalOrder: 4,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 36,
});

export const Deuteronomy = createBook({
    id: "DEU",
    canonicalName: "Deuteronomy",
    shortName: "Deuteronomy",
    abbreviation: "Deut",
    canonicalOrder: 5,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 34,
});

export const pentateuch = [
    Genesis,
    Exodus,
    Leviticus,
    Numbers,
    Deuteronomy,
] as const;