import { NonEmptyStringValueObject } from "@bsmp/shared";

export class VerseText extends NonEmptyStringValueObject {

    public static from(
        value: string,
    ): VerseText {

        return new VerseText(value);

    }

}