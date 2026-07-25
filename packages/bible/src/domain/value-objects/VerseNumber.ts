import { PositiveIntegerValueObject } from "@bsmp/shared";

/**
 * Represents the number of a verse within a biblical chapter.
 */
export class VerseNumber extends PositiveIntegerValueObject {
    private constructor(value: number) {
        super(value);
    }

    /**
     * Creates a VerseNumber.
     */
    public static from(value: number): VerseNumber {
        return new VerseNumber(value);
    }
}