import { ValidationError } from "../errors/ValidationError.js";
import { ValueObject } from "./ValueObject.js";

type NonEmptyStringProps = {
    value: string;
};

/**
 * Base class for immutable non-empty string value objects.
 */
export abstract class NonEmptyStringValueObject
    extends ValueObject<NonEmptyStringProps> {

    protected constructor(value: string) {
        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new ValidationError(
                "Value must not be empty.",
            );
        }

        super({
            value: normalized,
        });
    }

    /**
     * Gets the string value.
     */
    public get value(): string {
        return this.get("value");
    }
}