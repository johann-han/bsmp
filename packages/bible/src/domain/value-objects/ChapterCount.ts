import { PositiveIntegerValueObject } from "@bsmp/shared";

/**
 * Represents the total number of chapters in a biblical book.
 */
export class ChapterCount extends PositiveIntegerValueObject {
    private constructor(value: number) {
        super(value);
    }

    /**
     * Creates a ChapterCount.
     */
    public static from(value: number): ChapterCount {
        return new ChapterCount(value);
    }
}