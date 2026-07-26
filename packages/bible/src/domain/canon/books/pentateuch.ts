import {
    BibleDivision,
    Testament,
} from "../../classification/index.js";

import { createBook } from "../../factories/createBook.js";

export const Genesis = createBook({
    id: "GEN",
    canonicalName: "Genesis",
    shortName: "Gen",
    abbreviation: "Gen",
    canonicalOrder: 1,
    testament: Testament.Old,
    division: BibleDivision.Law,
    chapterCount: 50,
});

export const pentateuch = [
    Genesis,
] as const;