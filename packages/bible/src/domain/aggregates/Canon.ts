import {
    AggregateRoot,
    Guard,
    ValidationError,
} from "@bsmp/shared";

import { BibleBook } from "../entities/BibleBook.js";
import { CanonMetadata } from "../value-objects/CanonMetadata.js";
import { CanonId } from "../value-objects/CanonId.js";
import { BibleBookId, BookCode } from "../value-objects/index.js";

export class Canon extends AggregateRoot<CanonId> {

    private readonly _metadata: CanonMetadata;
    private readonly _books: ReadonlyArray<BibleBook>;

    private readonly _booksById: ReadonlyMap<string, BibleBook>;
    private readonly _booksByCode: ReadonlyMap<string, BibleBook>;

    private constructor(
        id: CanonId,
        metadata: CanonMetadata,
        books: ReadonlyArray<BibleBook>,
    ) {
        super(id);

        this._metadata = metadata;
        this._books = Object.freeze([...books]);

        // 👇 ADD THESE TWO BLOCKS HERE

        this._booksById = new Map(
            books.map(book => [book.id.value, book]),
        );

        this._booksByCode = new Map(
            books.map(book => [book.code.value, book]),
        );

        Object.freeze(this);
    }

    public static create(
        id: CanonId,
        metadata: CanonMetadata,
        books: ReadonlyArray<BibleBook>,
    ): Canon {

        if (!Guard.isDefined(id)) {
            throw new ValidationError(
                "CanonId is required.",
            );
        }

        if (!Guard.isDefined(metadata)) {
            throw new ValidationError(
                "Canon metadata is required.",
            );
        }

        if (!Guard.isDefined(books)) {
            throw new ValidationError(
                "Books collection is required.",
            );
        }

        if (books.length === 0) {
            throw new ValidationError(
                "A canon must contain at least one book.",
            );
        }

        const ids = new Set<string>();

        const codes = new Set<string>();

        for (const book of books) {

            const code = book.code.value;

            if (codes.has(code)) {
                throw new ValidationError(
                    `Duplicate BookCode '${code}'.`,
                );
            }

            codes.add(code);

        }

        for (const book of books) {

            const id = book.id.value;

            if (ids.has(id)) {
                throw new ValidationError(
                    `Duplicate BibleBookId '${id}'.`,
                );
            }

            ids.add(id);

        }

        const orders = new Set<number>();

        for (const book of books) {

            const order = book.canonicalOrder.value;

            if (orders.has(order)) {
                throw new ValidationError(
                    `Duplicate CanonicalOrder '${order}'.`,
                );
            }

            orders.add(order);

        }

        const orderedBooks = [...books].sort(
            (a, b) =>
                a.canonicalOrder.value - b.canonicalOrder.value,
        );

        return new Canon(
            id,
            metadata,
            orderedBooks,
        );
        
    }

    public get metadata(): CanonMetadata {
        return this._metadata;
    }

    public get books(): ReadonlyArray<BibleBook> {
        return this._books;
    }

    public get bookCount(): number {
        return this._books.length;
    }

    public get isEmpty(): boolean {
        return this._books.length === 0;
    }

    public findBookByCode(
        code: BookCode,
    ): BibleBook | undefined {

        return this._booksByCode.get(code.value);

    }

    public findBookById(
        id: BibleBookId,
    ): BibleBook | undefined {

        return this._booksById.get(id.value);

    }

    public containsBook(
        id: BibleBookId,
    ): boolean {

        return this.findBookById(id) !== undefined;

    }

    public firstBook(): BibleBook {
        return this._books[0]!;
    }

    public lastBook(): BibleBook {
        return this._books[this._books.length - 1]!;
    }

    public nextBook(
        book: BibleBook,
    ): BibleBook | undefined {

        const index = this._books.findIndex(
            b => b.id.equals(book.id),
        );

        if (index === -1) {
            return undefined;
        }

        return this._books[index + 1];
    }
}