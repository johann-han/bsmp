import { BibleDivision, Testament } from "../classification/index.js";
import { BibleBook } from "../entities/index.js";
import { BibleBookId } from "../value-objects/index.js";
import { PROTESTANT_CANON } from "../canon/index.js";



export class BibleBookCatalog {
    private static readonly books = PROTESTANT_CANON;

    public static all(): readonly BibleBook[] {
        return this.books;
    }

    public static count(): number {
        return this.books.length;
    }

    public static findById(
        id: BibleBookId,
    ): BibleBook | undefined {
        return this.books.find(book => book.id.equals(id));
    }

    public static exists(
        id: BibleBookId,
    ): boolean {
        return this.findById(id) !== undefined;
    }

    public static findByTestament(
        testament: Testament,
    ): readonly BibleBook[] {
        return this.books.filter(book => book.testament === testament);
    }

    public static findByDivision(
        division: BibleDivision,
    ): readonly BibleBook[] {
        return this.books.filter(book => book.division === division);
    }
}