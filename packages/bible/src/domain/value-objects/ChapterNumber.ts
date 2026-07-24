import { ValueObject } from "@bsmp/shared";

export class ChapterNumber extends ValueObject<number> {
    private constructor(value: number) {
        super(value);
    }

    public static of(value: number): ChapterNumber {
        if (!Number.isInteger(value)) {
            throw new Error("Chapter number must be an integer.");
        }

        if (value < 1) {
            throw new Error("Chapter number must be greater than zero.");
        }

        return new ChapterNumber(value);
    }
}