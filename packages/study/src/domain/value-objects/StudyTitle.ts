import {
    ValidationError,
    ValueObject,
} from "@bsmp/shared";

interface StudyTitleProps {

    value: string;

}

export class StudyTitle
    extends ValueObject<StudyTitleProps> {

    public static from(
        value: string,
    ): StudyTitle {

        const trimmed = value.trim();

        if (!trimmed) {

            throw new ValidationError(
                "Study title cannot be empty.",
            );

        }

        return new StudyTitle({
            value: trimmed,
        });

    }

    public get value(): string {

        return this.get("value");

    }

}