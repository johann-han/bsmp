import { ValidationError } from "../errors/ValidationError.js";
import { ValueObject } from "./ValueObject.js";

/**
 * Base class for immutable non-empty string value objects.
 */
export abstract class NonEmptyStringValueObject
    extends ValueObject<string> {

    protected constructor(value: string) {
        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new ValidationError(
                "Value must not be empty.",
            );
        }

        super(normalized);
    }
}