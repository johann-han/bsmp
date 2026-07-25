/**
 * Base class for immutable value objects.
 *
 * Value objects are compared by their values rather than identity.
 */
export abstract class ValueObject<T> {
    protected constructor(private readonly _value: T) { }

    /**
     * Gets the underlying value.
     */
    public get value(): T {
        return this._value;
    }

    /**
     * Determines whether two value objects are equal.
     */
    public equals(other: ValueObject<T>): boolean {
        return Object.is(this._value, other._value);
    }

    /**
     * Returns the underlying value.
     */
    public getValue(): T {
        return this._value;
    }

    /**
     * Serializes the value object.
     */
    public toJSON(): T {
        return this._value;
    }

    /**
     * Returns a string representation.
     */
    public toString(): string {
        return String(this._value);
    }
}