import { Chapter } from "../domain/value-objects/Chapter.js";
import { ChapterNumber } from "../domain/value-objects/ChapterNumber.js";

import { createVerse } from "./createVerse.js";

export function createChapter(): Chapter {

    return Chapter.create(
        ChapterNumber.of(1),
        [
            createVerse(1),
            createVerse(2),
            createVerse(3),
        ],
    );

}