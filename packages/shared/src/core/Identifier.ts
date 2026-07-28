import { ValueObject } from "./ValueObject.js";

type IdentifierProps<T> = {
    value: T;
};

/**
 * Base class for strongly typed identifiers.
 */
export abstract class Identifier<T>
    extends ValueObject<IdentifierProps<T>> {

    protected constructor(value: T) {
        super({
            value,
        });
    }

    /**
     * Gets the identifier value.
     */
    public get value(): T {
        return this.get("value");
    }
}