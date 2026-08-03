import {
    Book,
    BookCode,
    BookName,
    Chapter,
    ChapterNumber,
    Verse,
    VerseNumber,
    VerseReference,
    VerseText,
} from "../../../domain/value-objects/index.js";

import {
    ParsedBook,
    ParsedChapter,
    ParsedVerse,
} from "../parser/ParsedBook.js";

export class BookBuilder {

    public build(
        parsed: ParsedBook,
    ): Book {

        return Book.create(
            BookCode.from(parsed.id),
            BookName.from(parsed.id),
            parsed.chapters.map(
                chapter => this.buildChapter(
                    parsed.id,
                    chapter,
                ),
            ),
        );

    }

    private buildChapter(
        bookId: string,
        parsed: ParsedChapter,
    ): Chapter {

        return Chapter.create(
            ChapterNumber.of(parsed.number),
            parsed.verses.map(
                verse => this.buildVerse(
                    bookId,
                    parsed.number,
                    verse,
                ),
            ),
        );

    }

    private buildVerse(
        bookId: string,
        chapterNumber: number,
        parsed: ParsedVerse,
    ): Verse {

        return Verse.create(
            VerseReference.create(
                BookCode.from(bookId),
                ChapterNumber.of(chapterNumber),
                VerseNumber.from(parsed.number),
            ),
            VerseText.from(parsed.text),
        );

    }

}