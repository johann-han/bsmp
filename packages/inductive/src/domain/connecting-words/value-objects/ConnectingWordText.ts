import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

/**
 * Represents the text of a connecting word.
 *
 * Examples:
 * - Therefore
 * - But
 * - Because
 */
export class ConnectingWordText extends NonEmptyStringValueObject {

    private constructor(value: string) {

        const normalized = value.trim();

        if (normalized.length < 2) {
            throw new ValidationError(
                "Connecting word is too short.",
            );
        }

        if (normalized.length > 50) {
            throw new ValidationError(
                "Connecting word is too long.",
            );
        }

        super(normalized);

    }

    public static from(value: string): ConnectingWordText {
        return new ConnectingWordText(value);
    }

    public override toString(): string {
        return this.get("value");
    }

}