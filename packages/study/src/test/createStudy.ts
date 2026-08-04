import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import { StudySession } from "../domain/aggregates/StudySession.js";

import {
    StudyId,
    StudyTitle,
} from "../domain/value-objects/index.js";

export function createStudy(
    title = "Test Study",
): StudySession {

    const passage = Passage.create(
        VerseReference.create(
            BookCode.from("GEN"),
            ChapterNumber.of(1),
            VerseNumber.from(1),
        ),
        VerseReference.create(
            BookCode.from("GEN"),
            ChapterNumber.of(1),
            VerseNumber.from(31),
        ),
    );

    return StudySession.create(
        StudyId.create(),
        StudyTitle.from(title),
        passage,
    );

}