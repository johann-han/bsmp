import { describe, expect, it } from "vitest";
import { Bible } from "./Bible.js";
import { BibleId, } from "../value-objects/index.js";
import { BibleMetadata } from "../value-objects/BibleMetadata.js";
import { Language } from "../value-objects/Language.js";
import { Translation } from "../value-objects/Translation.js";

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
                translation
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
                translation
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
                translation
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
                createTranslation(),
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
            );

            // Assert
            expect(bible.translation).toBe(translation);

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