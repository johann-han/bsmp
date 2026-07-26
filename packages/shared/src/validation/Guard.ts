/**
 * Utility methods for validating primitive values.
 *
 * Guards do not throw exceptions.
 * They simply report whether a value satisfies a condition.
 */
export class Guard {
    public static isDefined<T>(
        value: T | null | undefined,
    ): value is T {
        return value !== null && value !== undefined;
    }

    public static isString(value: unknown): value is string {
        return typeof value === "string";
    }

    public static isNonEmptyString(value: unknown): value is string {
        return (
            typeof value === "string" &&
            value.trim().length > 0
        );
    }

    public static isPositiveInteger(value: unknown): value is number {
        return (
            typeof value === "number" &&
            Number.isInteger(value) &&
            value > 0
        );        
    }
    
  
}