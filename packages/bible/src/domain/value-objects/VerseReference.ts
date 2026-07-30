import { ValueObject } from "@bsmp/shared";

import { BookCode } from "./BookCode.js";
import { ChapterNumber } from "./ChapterNumber.js";
import { VerseNumber } from "./VerseNumber.js";

interface VerseReferenceProps {
    book: BookCode;
    chapter: ChapterNumber;
    verse: VerseNumber;
}

export class VerseReference extends ValueObject<VerseReferenceProps> {

    private constructor(props: VerseReferenceProps) {
        super(props);
    }

    public static create(
        book: BookCode,
        chapter: ChapterNumber,
        verse: VerseNumber,
    ): VerseReference {

        return new VerseReference({
            book,
            chapter,
            verse,
        });

    }

}