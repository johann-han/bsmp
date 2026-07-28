import { ValidationError } from "../errors/ValidationError.js";
import { Guard } from "../validation/Guard.js";
import { ValueObject } from "./ValueObject.js";

type PositiveIntegerProps = {
    value: number;
};

/**
 * Base class for immutable positive integer value objects.
 */
export abstract class PositiveIntegerValueObject
    extends ValueObject<PositiveIntegerProps> {

    protected constructor(value: number) {
        if (!Guard.isPositiveInteger(value)) {
            throw new ValidationError(
                "Value must be a positive integer.",
            );
        }

        super({
            value,
        });
    }

    /**
     * Gets the integer value.
     */
    public get value(): number {
        return this.get("value");
    }
}