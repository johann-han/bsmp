import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

export class Purpose extends NonEmptyStringValueObject {

    private constructor(value: string) {
        const normalized = value.trim();

        if (normalized.length < 10) {
            throw new ValidationError(
                "Purpose must contain a meaningful description.",
            );
        }

        super(normalized);
    }

    public static from(value: string): Purpose {
        return new Purpose(value);
    }

    public override toString(): string {
        return this.get("value");
    }

}