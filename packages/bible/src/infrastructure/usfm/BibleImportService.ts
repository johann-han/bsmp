import { Book } from "../../domain/value-objects/Book.js";

export interface BibleImportService {

    importBook(
        usfm: string,
    ): Book;

}