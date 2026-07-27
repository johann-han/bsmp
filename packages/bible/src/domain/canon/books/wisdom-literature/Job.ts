import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const Job = createBook({
    id: "JOB",
    canonicalName: "Job",
    shortName: "Job",
    abbreviation: "Job",
    canonicalOrder: 18,
    testament: Testament.Old,
    division: BibleDivision.PoetryAndWisdom,
    chapterCount: 42,
});