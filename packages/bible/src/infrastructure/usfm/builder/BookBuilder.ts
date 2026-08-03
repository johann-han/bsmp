import {
    Book,
    BookCode,
    BookName,
} from "../../../domain/value-objects/index.js";

import { ParsedBook } from "../parser/ParsedBook.js";

export class BookBuilder {

    public build(
        parsed: ParsedBook,
    ): Book {

        return Book.create(
            BookCode.from(parsed.id),
            BookName.from(parsed.id),
            [],
        );

    }

}