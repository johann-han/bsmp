/**
 * Base class for immutable value objects.
 *
 * Value objects are compared by their values rather than by identity.
 */
export abstract class ValueObject<T> {
    protected constructor(private readonly value: T) { }

    /**
     * Returns the underlying value.
     */
    public getValue(): T {
        return this.value;
    }

    /**
     * Determines whether two value objects are equal.
     */
    public equals(other: ValueObject<T>): boolean {
        return Object.is(this.value, other.value);
    }

    /**
     * Returns the value as JSON.
     */
    public toJSON(): T {
        return this.value;
    }

    /**
     * Returns a string representation.
     */
    public toString(): string {
        return String(this.value);
    }
}