import { ValueObject } from "@bsmp/shared";

export class ChapterCount extends ValueObject<number> {
    private constructor(value: number) {
        super(value);
    }

    public static of(value: number): ChapterCount {
        if (!Number.isInteger(value)) {
            throw new Error("Chapter count must be an integer.");
        }

        if (value < 1) {
            throw new Error("Chapter count must be greater than zero.");
        }

        return new ChapterCount(value);
    }
}