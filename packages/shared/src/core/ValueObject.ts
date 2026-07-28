import { deepEqual } from "./deepEqual.js";

/**
 * Base class for immutable value objects.
 */
export abstract class ValueObject<TProps extends object> {

    protected constructor(
        private readonly props: Readonly<TProps>,
    ) {
        this.props = Object.freeze({ ...props });
        Object.freeze(this);
    }

    /**
     * Gets a property.
     */
    protected get<K extends keyof TProps>(
        key: K,
    ): TProps[K] {
        return this.props[key];
    }

    /**
     * Value equality.
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
     * Serialize.
     */
    public toJSON(): Readonly<TProps> {
        return { ...this.props };
    }

}