import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

/**
 * Describes the interpretive meaning of a connecting word.
 */
export class ConnectingWordMeaning extends NonEmptyStringValueObject {

    private constructor(value: string) {

        const normalized = value.trim();

        if (normalized.length < 10) {
            throw new ValidationError(
                "Meaning must contain a meaningful description.",
            );
        }

        if (normalized.length > 500) {
            throw new ValidationError(
                "Meaning is too long.",
            );
        }

        super(normalized);

    }

    public static from(value: string): ConnectingWordMeaning {
        return new ConnectingWordMeaning(value);
    }

    public override toString(): string {
        return this.get("value");
    }

}