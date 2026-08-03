import {
    BookCode,
    BookName,
} from "../domain/value-objects/index.js";

import { Book } from "../domain/value-objects/Book.js";

import { createChapter } from "./createChapter.js";

export function createBook(): Book {

    return Book.create(
        BookCode.from("GEN"),
        BookName.from("Genesis"),
        [
            createChapter(),
        ],
    );

}