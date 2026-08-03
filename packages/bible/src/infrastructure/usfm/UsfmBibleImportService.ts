import { Bible } from "../../domain/aggregates/Bible.js";
import {
    BibleMetadata,
    Book,
    Language,
    Translation,
} from "../../domain/value-objects/index.js";

import { NodeFileSystem } from "../files/NodeFileSystem.js";
import { BibleBuilder } from "./builder/BibleBuilder.js";
import { BookBuilder } from "./builder/BookBuilder.js";
import { UsfmLexer } from "./lexer/UsfmLexer.js";
import { UsfmParser } from "./parser/UsfmParser.js";

import { BibleImportService } from "./BibleImportService.js";

export class UsfmBibleImportService
    implements BibleImportService {

    private readonly fileSystem = new NodeFileSystem();

    private readonly lexer = new UsfmLexer();

    private readonly parser = new UsfmParser();

    private readonly bookBuilder = new BookBuilder();

    private readonly bibleBuilder = new BibleBuilder();

    public importBook(
        usfm: string,
    ): Book {

        const tokens = this.lexer.tokenize(usfm);

        const parsed = this.parser.parse(tokens);

        return this.bookBuilder.build(parsed);

    }

    public async importBible(
        folder: string,
    ): Promise<Bible> {

        const files = await this.fileSystem.readDirectory(
            folder,
        );

        const books: Book[] = [];

        for (const file of files) {

            if (!file.endsWith(".usfm")) {
                continue;
            }

            const usfm = await this.fileSystem.readFile(
                `${folder}/${file}`,
            );

            books.push(
                this.importBook(usfm),
            );

        }

        return this.bibleBuilder.build(
            books,
            BibleMetadata.create({
                displayName: "Imported Bible",
                abbreviation: "IMP",
            }),
            Language.from("en"),
            Translation.from("Imported"),
        );

    }

}