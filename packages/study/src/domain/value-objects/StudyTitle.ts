import { ValueObject } from "@bsmp/shared";

interface StudyTitleProps {

    value: string;

}

export class StudyTitle
    extends ValueObject<StudyTitleProps> {

    public static from(
        value: string,
    ): StudyTitle {

        return new StudyTitle({
            value,
        });

    }

    public get value(): string {

        return this.get("value");

    }

}