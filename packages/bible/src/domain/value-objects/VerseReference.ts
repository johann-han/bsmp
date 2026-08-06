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
    public compareTo(
        other: VerseReference,
    ): number {

        if (!this.book.equals(other.book)) {
            throw new Error(
                "Comparison across books is not yet supported.",
            );
        }

        if (!this.chapter.equals(other.chapter)) {
            return this.chapter.value - other.chapter.value;
        }

        return this.verse.value - other.verse.value;

    }

    private constructor(
        props: VerseReferenceProps,
    ) {
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
    

    public get book(): BookCode {
        return this.get("book");
    }

    public get chapter(): ChapterNumber {
        return this.get("chapter");
    }

    public get verse(): VerseNumber {
        return this.get("verse");
    }

    public override toString(): string {

        return `${this.book.value} ${this.chapter.value}:${this.verse.value}`;

    }

}