import {
    NonEmptyStringValueObject,
    ValidationError,
} from "@bsmp/shared";

export class ObservationQuestionId extends NonEmptyStringValueObject {

    private constructor(value: string) {
        const normalized = value.trim().toUpperCase();

        if (!/^OBSQ-\d{3}$/.test(normalized)) {
            throw new ValidationError(
                "Observation Question ID must match OBSQ-001.",
            );
        }

        super(normalized);
    }

    public static from(value: string): ObservationQuestionId {
        return new ObservationQuestionId(value);
    }

    public override toString(): string {
        return this.value;
    }

}