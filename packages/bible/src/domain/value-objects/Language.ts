import { NonEmptyStringValueObject } from "@bsmp/shared";

export class Language extends NonEmptyStringValueObject {

    public static from(
        value: string,
    ): Language {

        return new Language(value);

    }

}