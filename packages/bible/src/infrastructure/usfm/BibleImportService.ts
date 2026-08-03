import { Bible } from "../../domain/aggregates/Bible.js";
import { Book } from "../../domain/value-objects/Book.js";

export interface BibleImportService {

    importBook(
        usfm: string,
    ): Book;
    
    

    importBible(
        folder: string,
    ): Promise<Bible>;

   

}