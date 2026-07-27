import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Colossians = createBook({
    id: "COL",
    canonicalName: "Colossians",
    shortName: "Colossians",
    abbreviation: "Col",
    canonicalOrder: 51,
    testament: Testament.New,
    division: BibleDivision.PaulineEpistles,
    chapterCount: 4,
});