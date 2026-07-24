/**
 * Base class for immutable value objects.
 */

// packages/shared/src/core/index.ts
export * from "./ValueObject.js";

export abstract class ValueObject<T> {
    protected constructor(protected readonly value: T) { }

    public equals(other: ValueObject<T>): boolean {
        return this.value === other.value;
    }

    public toString(): string {
        return String(this.value);
    }

    public toJSON(): T {
        return this.value;
    }

    public getValue(): T {
        return this.value;
    }
}