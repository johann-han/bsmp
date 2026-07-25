/**
 * Base class for immutable value objects.
 */
export abstract class ValueObject<T> {
    protected constructor(private readonly _value: T) { }

    public get value(): T {
        return this._value;
    }

    public equals(other: ValueObject<T>): boolean {
        if (this === other) {
            return true;
        }

        return this.areEqual(this._value, other._value);
    }

    public getValue(): T {
        return this._value;
    }

    public toJSON(): T {
        return this._value;
    }

    public toString(): string {
        return String(this._value);
    }

    private areEqual(a: unknown, b: unknown): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }
}