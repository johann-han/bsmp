import { BibleDivision, Testament } from "../classification/index.js";
import { ProtestantCanon } from "../canon/index.js";
import { BibleBook } from "../entities/index.js";
import { BibleBookId } from "../value-objects/index.js";

export class BibleBookCatalog {
    private static readonly canon = ProtestantCanon;

    public static all(): readonly BibleBook[] {
        return this.canon.books;
    }

    public static count(): number {
        return this.canon.books.length;
    }

    public static findById(
        id: BibleBookId,
    ): BibleBook | undefined {
        return this.canon.book(id);
    }

    public static exists(
        id: BibleBookId,
    ): boolean {
        return this.canon.contains(id);
    }

    public static findByTestament(
        testament: Testament,
    ): readonly BibleBook[] {
        return this.canon.books.filter(
            book => book.testament === testament,
        );
    }

    public static findByDivision(
        division: BibleDivision,
    ): readonly BibleBook[] {
        return this.canon.books.filter(
            book => book.division === division,
        );
    }
}