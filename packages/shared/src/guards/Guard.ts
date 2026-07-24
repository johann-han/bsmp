export class Guard {
    public static againstNullOrUndefined<T>(
        value: T | null | undefined,
        name: string,
    ): void {
        if (value === null || value === undefined) {
            throw new Error(`${name} cannot be null or undefined.`);
        }
    }

    public static againstEmptyString(
        value: string,
        name: string,
    ): void {
        if (value.trim().length === 0) {
            throw new Error(`${name} cannot be empty.`);
        }
    }

    public static againstNonPositiveInteger(
        value: number,
        name: string,
    ): void {
        if (!Number.isInteger(value) || value < 1) {
            throw new Error(`${name} must be a positive integer.`);
        }
    }
}