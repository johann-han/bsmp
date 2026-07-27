import {
    BibleDivision,
    Testament,
} from "../../../classification/index.js";

import { createBook } from "../../../factories/createBook.js";

export const SongOfSongs = createBook({
    id: "SNG",
    canonicalName: "Song of Songs",
    shortName: "Song",
    abbreviation: "Song",
    canonicalOrder: 22,
    testament: Testament.Old,
    division: BibleDivision.PoetryAndWisdom,
    chapterCount: 8,
});