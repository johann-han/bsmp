import { AggregateRoot } from "@bsmp/shared";

import { BibleId } from "../value-objects/BibleId.js";
import { BibleMetadata } from "../value-objects/BibleMetadata.js";
import { Book, BookCode, Language, Passage, Translation } from "../value-objects/index.js";
import { Verse } from "../value-objects/Verse.js";

export class Bible extends AggregateRoot<BibleId> {

    private readonly _metadata: BibleMetadata;
    private readonly _language: Language;
    private readonly _translation: Translation;
    private readonly _books: readonly Book[];

    private constructor(
        id: BibleId,
        metadata: BibleMetadata,
        language: Language,
        translation: Translation,
        books: readonly Book[],
    ) {
        super(id);

        this._metadata = metadata;
        this._language = language;
        this._translation = translation;
        this._books = books;
    }

    public static create(
        id: BibleId,
        metadata: BibleMetadata,
        language: Language,
        translation: Translation,
        books: readonly Book[],
    ): Bible {

        return new Bible(
            id,
            metadata,
            language,
            translation,
            books,
        );

    }

    public get metadata(): BibleMetadata {
        return this._metadata;
    }

    public get language(): Language {
        return this._language;
    }

    public get translation(): Translation {
        return this._translation;
    }

    public get books(): readonly Book[] {
        return this._books;
    }

    public read(
        passage: Passage,
    ): readonly Verse[] {

        const start = passage.start;

        const book = this.book(
            start.book,
        );

        if (!book) {
            return [];
        }

        const chapter = book.chapter(
            start.chapter,
        );

        if (!chapter) {
            return [];
        }

        const verse = chapter.verse(
            start.verse,
        );

        if (!verse) {
            return [];
        }

        return [verse];

    }

    public book(
        code: BookCode,
    ): Book | undefined {

        return this._books.find(
            book => book.code.equals(code),
        );

    }

}