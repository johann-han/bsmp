import { Guard } from "../guards/Guard.js";
import { ValidationError } from "../errors/ValidationError.js";
import { ValueObject } from "./ValueObject.js";

/**
 * Base class for immutable positive integer value objects.
 */
export abstract class PositiveIntegerValueObject
    extends ValueObject<number> {

    protected constructor(value: number) {
        if (!Guard.isPositiveInteger(value)) {
            throw new ValidationError(
                "Value must be a positive integer."
            );
        }

        super(value);
    }

    /**
     * Returns the underlying integer value.
     */
    public get value(): number {
        return this.getValue();
    }
}