import { Guard } from "@bsmp/shared";

import { BibleBook } from "../entities/BibleBook.js";
import { BibleBookId } from "../value-objects/BibleBookId.js";
import { CanonDefinition } from "./CanonDefinition.js";
import { CanonId } from "../value-objects/CanonId.js";
import { CanonMetadata } from "../value-objects/CanonMetadata.js";
import { CanonicalOrder } from "../value-objects/CanonicalOrder.js";

export class Canon {

    private readonly _definition: CanonDefinition;
    private readonly _booksById: ReadonlyMap<string, BibleBook>;

    private constructor(
        definition: CanonDefinition,
    ) {
        this._definition = definition;

        this._booksById = new Map(
            definition.books.map(book => [
                book.id.code,
                book,
            ]),
        );
    }

    public static create(
        definition: CanonDefinition,
    ): Canon {

        if (!Guard.isDefined(definition)) {
            throw new Error("Canon definition is required.");
        }

        return new Canon(definition);
    }

    public get id(): CanonId {
        return this._definition.id;
    }

    public get metadata(): CanonMetadata {
        return this._definition.metadata;
    }

    public get books(): readonly BibleBook[] {
        return this._definition.books;
    }

    public contains(
        id: BibleBookId,
    ): boolean {

        return this._booksById.has(id.code);
    }

    public book(
        id: BibleBookId,
    ): BibleBook | undefined {

        return this._booksById.get(id.code);
    }

    public bookByCanonicalOrder(
        order: CanonicalOrder,
    ): BibleBook | undefined {

        return this.books.find(
            book => book.canonicalOrder.equals(order),
        );
    }

    public get firstBook(): BibleBook {
        return this.books[0]!;
    }

    public get lastBook(): BibleBook {
        return this.books[this.books.length - 1]!;
    }

    public next(
        book: BibleBook,
    ): BibleBook | undefined {

        const index = this.books.findIndex(
            current => current.id.equals(book.id),
        );

        return index === -1
            ? undefined
            : this.books[index + 1];
    }

    public previous(
        book: BibleBook,
    ): BibleBook | undefined {

        const index = this.books.findIndex(
            current => current.id.equals(book.id),
        );

        return index <= 0
            ? undefined
            : this.books[index - 1];
    }

}



