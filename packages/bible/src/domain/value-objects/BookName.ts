import { NonEmptyStringValueObject } from "@bsmp/shared";

/**
 * Represents the validated name of a Bible book.
 */
export class BookName extends NonEmptyStringValueObject {
    private constructor(value: string) {
        super(value);
    }

    /**
     * Creates a BookName.
     */
    public static from(value: string): BookName {
        return new BookName(value);
    }

    /**
     * Returns the book name as a string.
     */
    public override toString(): string {
        return this.value;
    }
}