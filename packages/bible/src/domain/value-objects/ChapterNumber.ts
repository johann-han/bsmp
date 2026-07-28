export class InvalidChapterNumberError extends Error {
    constructor(value: unknown) {
        super(`Invalid chapter number: ${String(value)}.`);
        this.name = "InvalidChapterNumberError";
    }
}

export class ChapterNumber {
    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
        Object.freeze(this);
    }

    public static of(value: number): ChapterNumber {
        if (
            !Number.isInteger(value) ||
            !Number.isFinite(value) ||
            value <= 0
        ) {
            throw new InvalidChapterNumberError(value);
        }

        return new ChapterNumber(value);
    }

    public equals(other: ChapterNumber): boolean {
        return this.value === other.value;
    }

    public compareTo(other: ChapterNumber): number {
        return this.value - other.value;
    }

    public toString(): string {
        return this.value.toString();
    }
}