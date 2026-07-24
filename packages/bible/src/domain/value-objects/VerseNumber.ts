import { ValueObject } from "@bsmp/shared";

export class VerseNumber extends ValueObject<number> {
    private constructor(value: number) {
        super(value);
    }

    public static of(value: number): VerseNumber {
        if (!Number.isInteger(value)) {
            throw new Error("Verse number must be an integer.");
        }

        if (value < 1) {
            throw new Error("Verse number must be greater than zero.");
        }

        return new VerseNumber(value);
    }
}