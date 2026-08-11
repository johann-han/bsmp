import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

/**
 * Represents the unique code of a Bible book.
 *
 * Examples:
 * - GEN
 * - 1CH
 * - EXO
 * - MAT
 * - REV
 */
export class BookCode extends NonEmptyStringValueObject {

    private constructor(value: string) {
        const normalized = value.trim().toUpperCase();

        if (normalized.length < 3) {
            throw new ValidationError(
                "Book code must be at least 3 characters.",
            );
        }

        if (normalized.length > 5) {
            throw new ValidationError(
                "Book code must not exceed 5 characters.",
            );
        }

        if (!/^[A-Z0-9]+$/.test(normalized)) {
            throw new ValidationError(
                "Book code must contain only uppercase letters and digits.",
            );
        }

        super(normalized);
    }

    /**
     * Creates a BookCode.
     */
    public static from(value: string): BookCode {
        return new BookCode(value);
    }

    /**
     * Returns the book code.
     */
    public override toString(): string {
        return this.value;
    }
}
