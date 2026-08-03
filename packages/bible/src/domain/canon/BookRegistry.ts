import { BookCode } from "../value-objects/BookCode.js";

interface BookDefinition {
    code: string;
    name: string;
    order: number;
}

const BOOKS: readonly BookDefinition[] = [
    { code: "GEN", name: "Genesis", order: 1 },
    { code: "EXO", name: "Exodus", order: 2 },
    { code: "LEV", name: "Leviticus", order: 3 },
    { code: "NUM", name: "Numbers", order: 4 },
    { code: "DEU", name: "Deuteronomy", order: 5 },
];

export class BookRegistry {

    public static nameFor(
        code: BookCode,
    ): string {

        const book = BOOKS.find(
            b => b.code === code.value,
        );

        if (!book) {
            throw new Error(
                `Unknown Bible book: ${code.value}`,
            );
        }

        return book.name;

    }

    public static orderFor(
        code: BookCode,
    ): number {

        const book = BOOKS.find(
            b => b.code === code.value,
        );

        if (!book) {
            throw new Error(
                `Unknown Bible book: ${code.value}`,
            );
        }

        return book.order;

    }

}