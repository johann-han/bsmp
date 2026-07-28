import { ValueObject, Guard } from "@bsmp/shared";

import { BibleBook } from "../entities/BibleBook.js";
import { CanonId } from "../value-objects/CanonId.js";
import { CanonMetadata } from "../value-objects/CanonMetadata.js";

export interface CanonDefinitionProps {
    id: CanonId;
    metadata: CanonMetadata;
    books: readonly BibleBook[];
}

export class CanonDefinition
    extends ValueObject<CanonDefinitionProps> {

    private constructor(
        props: CanonDefinitionProps,
    ) {
        super(props);
    }

    public static create(
        props: CanonDefinitionProps,
    ): CanonDefinition {

        if (!Guard.isDefined(props.id)) {
            throw new Error("Canon ID is required.");
        }

        if (!Guard.isDefined(props.metadata)) {
            throw new Error("Canon metadata is required.");
        }

        if (!Guard.isDefined(props.books)) {
            throw new Error("Books are required.");
        }

        if (props.books.length === 0) {
            throw new Error(
                "A canon must contain at least one book.",
            );
        }

        CanonDefinition.validateBooks(props.books);

        return new CanonDefinition({
            ...props,
            books: [...props.books],
        });
    }

    private static validateBooks(
        books: readonly BibleBook[],
    ): void {

        const ids = new Set<string>();
        const orders = new Set<number>();

        for (const book of books) {

            if (ids.has(book.id.code)) {
                throw new Error(
                    `Duplicate BibleBookId: ${book.id.code}`,
                );
            }

            ids.add(book.id.code);

            if (orders.has(book.canonicalOrder.value)) {
                throw new Error(
                    `Duplicate CanonicalOrder: ${book.canonicalOrder.value}`,
                );
            }

            orders.add(book.canonicalOrder.value);
        }

        for (let i = 1; i < books.length; i++) {

            const previous = books[i - 1]!;
            const current = books[i]!;

            if (
                previous.canonicalOrder.value >
                current.canonicalOrder.value
            ) {
                throw new Error(
                    "Books must be sorted by canonical order.",
                );
            }
        }
    }

    public get id(): CanonId {
        return this.get("id");
    }

    public get metadata(): CanonMetadata {
        return this.get("metadata");
    }

    public get books(): readonly BibleBook[] {
        return [...this.get("books")];
    }
}