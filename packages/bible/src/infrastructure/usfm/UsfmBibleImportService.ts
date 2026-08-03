import { Book } from "../../domain/value-objects/Book.js";

import { BookBuilder } from "./builder/BookBuilder.js";
import { UsfmLexer } from "./lexer/UsfmLexer.js";
import { UsfmParser } from "./parser/UsfmParser.js";

import { BibleImportService } from "./BibleImportService.js";

export class UsfmBibleImportService
    implements BibleImportService {

    private readonly lexer = new UsfmLexer();

    private readonly parser = new UsfmParser();

    private readonly builder = new BookBuilder();

    public importBook(
        usfm: string,
    ): Book {

        const tokens =
            this.lexer.tokenize(usfm);

        const parsed =
            this.parser.parse(tokens);

        return this.builder.build(parsed);

    }

}