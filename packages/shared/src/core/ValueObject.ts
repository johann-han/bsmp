import { deepEqual } from "./deepEqual.js";

/**
 * Base class for immutable value objects.
 *
 * Value objects are defined entirely by the values they contain,
 * not by identity.
 */
export abstract class ValueObject<TProps extends object> {

    protected constructor(
        private readonly props: Readonly<TProps>,
    ) {
        this.props = Object.freeze({ ...props });
        Object.freeze(this);
    }

    /**
     * Gets a property from this value object.
     */
    protected get<K extends keyof TProps>(
        key: K,
    ): TProps[K] {
        return this.props[key];
    }

    /**
     * Determines whether this value object equals another.
     */
    public equals(
        other: unknown,
    ): boolean {
        return (
            other instanceof ValueObject &&
            this.constructor === other.constructor &&
            deepEqual(
                this.props,
                other.props,
            )
        );
    }

    /**
     * Returns a JSON-serializable representation of this value object.
     */
    public toJSON(): Readonly<TProps> {
        return { ...this.props };
    }

    /**
     * Returns a string representation of this value object.
     *
     * Primitive value objects should override this method to return
     * their underlying value directly.
     */
    public toString(): string {
        return JSON.stringify(this.toJSON());
    }
}