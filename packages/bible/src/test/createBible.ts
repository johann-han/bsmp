import { BibleBuilder } from "../infrastructure/usfm/builder/BibleBuilder.js";

import {
    BibleMetadata,
    Language,
    Translation,
} from "../domain/value-objects/index.js";

import { createBook } from "./createBook.js";

export function createBible() {

    return new BibleBuilder().build(
        [createBook()],
        BibleMetadata.create({
            displayName: "Test Bible",
            abbreviation: "TEST",
        }),
        Language.from("en"),
        Translation.from("Test"),
    );

}