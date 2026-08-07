import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

export class QuestionText extends NonEmptyStringValueObject {

    private constructor(value: string) {
        const normalized = value.trim();

        if (normalized.length < 2) {
            throw new ValidationError(
                "Question text is too short.",
            );
        }

        if (normalized.length > 200) {
            throw new ValidationError(
                "Question text is too long.",
            );
        }

        super(normalized);
    }

    public static from(value: string): QuestionText {
        return new QuestionText(value);
    }

    public override toString(): string {
        return this.get("value");
    }

}