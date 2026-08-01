import { describe, expect, it } from "vitest";
import { Bible } from "./Bible.js";
import { BibleId, Chapter, ChapterNumber, Passage, VerseNumber, VerseReference, VerseText, } from "../value-objects/index.js";
import { BibleMetadata } from "../value-objects/BibleMetadata.js";
import { Language } from "../value-objects/Language.js";
import { Translation } from "../value-objects/Translation.js";
import { Book } from "../value-objects/Book.js";
import { BookCode } from "../value-objects/BookCode.js";
import { BookName } from "../value-objects/BookName.js";
import { Verse } from "../value-objects/Verse.js";

function createMetadata(): BibleMetadata {
    return BibleMetadata.create({
        displayName: "King James Version",
        abbreviation: "KJV",
    });
}

function createLanguage(): Language {
    return Language.from("English");
}

function createTranslation(): Translation {
    return Translation.from("KJV");

}

function createVerse(
    number: number,
    text: string,
): Verse {

    const reference = VerseReference.create(
        BookCode.from("GEN"),
        ChapterNumber.of(1),
        VerseNumber.from(number),
    );

    return Verse.create(
        reference,
        VerseText.from(text),
    );

}

function createBible(
    books: readonly Book[],
): Bible {

    return Bible.create(
        BibleId.from("KJV"),
        createMetadata(),
        createLanguage(),
        createTranslation(),
        books,
    );

}

describe("Bible", () => {
    describe("create()", () => {
        it("creates a valid Bible", () => {

            // Arrange

            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const translation = createTranslation();


            // Act

            const bible = Bible.create(
                id,
                metadata,
                language,
                translation,
                [],
            );

            // Assert

            expect(bible).toBeInstanceOf(Bible);

        });

        it("has an identity", () => {

            // Arrange

            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const translation = createTranslation();

            // Act

            const bible = Bible.create(
                id,
                metadata,
                language,
                translation,
                [],
            );

            // Assert

            expect(bible.id).toBe(id);

        });

        it("stores its metadata", () => {

            // Arrange

            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const translation = createTranslation();

            // Act

            const bible = Bible.create(
                id,
                metadata,
                language,
                translation,
                [],
            );

            // Assert

            expect(bible.metadata).toBe(metadata);

        });

        it("stores its language", () => {

            // Arrange

            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const translation = createTranslation();

            // Act

            const bible = Bible.create(
                id,
                metadata,
                language,
                translation,
                [],
            );

            // Assert

            expect(bible.language).toBe(language);

        });

        it("stores its translation", () => {

            // Arrange
            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const translation = Translation.from("KJV");


            // Act
            const bible = Bible.create(
                id,
                metadata,
                language,
                translation,
                [],
            );

            // Assert
            expect(bible.translation).toBe(translation);

        });

        it("returns a book by its code", () => {

            // Arrange

            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const translation = createTranslation();

            const genesis = Book.create(
                BookCode.from("GEN"),
                BookName.from("Genesis"),
                [],
            );

            const bible = Bible.create(
                id,
                metadata,
                language,
                translation,
                [genesis],
            );

            // Act

            const book = bible.book(
                BookCode.from("GEN"),
            );

            // Assert

            expect(book).toBe(genesis);

        });

        it("reads a single-verse passage", () => {

            // Arrange

            const reference = VerseReference.create(
                BookCode.from("GEN"),
                ChapterNumber.of(1),
                VerseNumber.from(1),
            );

            const verse = Verse.create(
                reference,
                VerseText.from(
                    "In the beginning God created the heaven and the earth.",
                ),
            );

            const chapter = Chapter.create(
                ChapterNumber.of(1),
                [verse],
            );

            const genesis = Book.create(
                BookCode.from("GEN"),
                BookName.from("Genesis"),
                [chapter],
            );

            const bible = Bible.create(
                BibleId.from("KJV"),
                createMetadata(),
                createLanguage(),
                createTranslation(),
                [genesis],
            );

            const passage = Passage.create(
                reference,
                reference,
            );

            // Act

            const verses = bible.read(passage);

            // Assert

            expect(verses).toEqual([verse]);

        });

        it("reads a multi-verse passage", () => {

            // Arrange

            const verse1 = createVerse(1, "Verse 1");
            const verse2 = createVerse(2, "Verse 2");
            const verse3 = createVerse(3, "Verse 3");

            const chapter = Chapter.create(
                ChapterNumber.of(1),
                [verse1, verse2, verse3],
            );

            const genesis = Book.create(
                BookCode.from("GEN"),
                BookName.from("Genesis"),
                [chapter],
            );

            const bible = createBible([genesis]);

            const passage = Passage.create(
                verse1.reference,
                verse3.reference,
            );

            // Act

            const verses = bible.read(passage);

            // Assert

            expect(verses).toEqual([
                verse1,
                verse2,
                verse3,
            ]);

        });

        /* it("stores its canon", () => {

            // Arrange

            const id = BibleId.from("KJV");
            const metadata = createMetadata();
            const language = createLanguage();
            const canon = createCanon();

            // Act

            const bible = Bible.create(
                id,
                metadata,
                language,
                canon,
            );

            // Assert

            expect(bible.canon).toBe(canon);

        }); */



    });

});