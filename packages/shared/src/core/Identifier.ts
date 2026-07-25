import { ValueObject } from "./ValueObject.js";

/**
 * Base class for strongly typed identifiers.
 */
export abstract class Identifier<T> extends ValueObject<T> {
    protected constructor(value: T) {
        super(value);
    }
}