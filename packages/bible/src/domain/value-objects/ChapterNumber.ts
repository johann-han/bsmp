import { PositiveIntegerValueObject } from "@bsmp/shared";

/**
 * Represents the number of a chapter within a biblical book.
 */
export class ChapterNumber extends PositiveIntegerValueObject {
    private constructor(value: number) {
        super(value);
    }

    /**
     * Creates a ChapterNumber.
     */
    public static from(value: number): ChapterNumber {
        return new ChapterNumber(value);
    }
}