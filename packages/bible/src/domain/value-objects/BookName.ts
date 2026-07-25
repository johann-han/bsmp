import { NonEmptyStringValueObject } from "@bsmp/shared";

/**
 * Represents a validated Bible book name.
 */
export class BookName extends NonEmptyStringValueObject {
    private constructor(value: string) {
        super(value);
    }

    public static from(value: string): BookName {
        return new BookName(value);
    }
}