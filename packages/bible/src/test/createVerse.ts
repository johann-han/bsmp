import {
    BookCode,
    ChapterNumber,
    VerseNumber,
    VerseReference,
    VerseText,
} from "../domain/value-objects/index.js";

import { Verse } from "../domain/value-objects/Verse.js";

export function createVerse(
    number: number,
    text = `Verse ${number}`,
): Verse {

    return Verse.create(
        VerseReference.create(
            BookCode.from("GEN"),
            ChapterNumber.of(1),
            VerseNumber.from(number),
        ),
        VerseText.from(text),
    );

}