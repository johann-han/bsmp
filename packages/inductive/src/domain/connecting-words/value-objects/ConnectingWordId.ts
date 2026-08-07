import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

/**
 * Represents the unique identifier of a connecting word.
 *
 * Examples:
 * - CW-001
 * - CW-002
 */
export class ConnectingWordId extends NonEmptyStringValueObject {

    private constructor(value: string) {

        const normalized = value.trim().toUpperCase();

        if (!/^CW-\d{3}$/.test(normalized)) {
            throw new ValidationError(
                "Connecting Word ID must match CW-001.",
            );
        }

        super(normalized);

    }

    public static from(value: string): ConnectingWordId {
        return new ConnectingWordId(value);
    }

    public override toString(): string {
        return this.get("value");
    }

}