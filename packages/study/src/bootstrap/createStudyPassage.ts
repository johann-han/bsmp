import {
    Bible,
    BibleId,
    BibleMetadata,
    Book,
    BookCode,
    BookName,
    Chapter,
    ChapterNumber,
    Language,
    Passage,
    ReadPassage,
    Translation,
    Verse,
    VerseNumber,
    VerseReference,
    VerseText,
} from "@bsmp/bible";

import { InMemoryBibleRepository } from "@bsmp/bible";

import { StudyPassageService } from "../application/services/StudyPassageService.js";

const demoVerses = [
    "I am the true vine, and my Father is the husbandman.",
    "Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit.",
    "Now ye are clean through the word which I have spoken unto you.",
    "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me.",
    "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
    "If a man abide not in me, he is cast forth as a branch, and is withered; and men gather them, and cast them into the fire, and they are burned.",
    "If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you.",
    "Herein is my Father glorified, that ye bear much fruit; so shall ye be my disciples.",
    "As the Father hath loved me, so have I loved you: continue ye in my love.",
    "If ye keep my commandments, ye shall abide in my love; even as I have kept my Father's commandments, and abide in his love.",
    "These things have I spoken unto you, that my joy might remain in you, and that your joy might be full.",
];

function createDevelopmentBible(): Bible {
    const bookCode = BookCode.from("JHN");
    const chapterNumber = ChapterNumber.of(15);

    const verses = demoVerses.map((text, index) => {
        const verseNumber = VerseNumber.from(index + 1);
        const reference = VerseReference.create(
            bookCode,
            chapterNumber,
            verseNumber,
        );

        return Verse.create(
            reference,
            VerseText.from(text),
        );
    });

    const chapter = Chapter.create(
        chapterNumber,
        verses,
    );

    const book = Book.create(
        bookCode,
        BookName.from("John"),
        [chapter],
    );

    return Bible.create(
        BibleId.from("bsmp-development-kjv"),
        BibleMetadata.create({
            displayName: "BSMP Development Bible",
            abbreviation: "KJV",
        }),
        Language.from("en"),
        Translation.from("KJV"),
        [book],
    );
}

export function createStudyPassage(): StudyPassageService {
    const bibleRepository = new InMemoryBibleRepository(
        createDevelopmentBible(),
    );

    const readPassage = new ReadPassage(
        bibleRepository,
    );

    const passage = Passage.create(
        VerseReference.create(
            BookCode.from("JHN"),
            ChapterNumber.of(15),
            VerseNumber.from(1),
        ),
        VerseReference.create(
            BookCode.from("JHN"),
            ChapterNumber.of(15),
            VerseNumber.from(11),
        ),
    );

    return new StudyPassageService(
        readPassage,
        passage,
        "KJV",
    );
}