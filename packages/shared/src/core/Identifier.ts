/**
 * Base class for strongly typed identifiers.
 */
import { ValueObject } from "./ValueObject.js";

export abstract class Identifier<T> extends ValueObject<T> {
    protected constructor(value: T) {
        super(value);
    }
}