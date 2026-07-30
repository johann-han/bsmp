import { NonEmptyStringValueObject } from "@bsmp/shared";

export class Translation extends NonEmptyStringValueObject {

    public static from(
        value: string,
    ): Translation {

        return new Translation(value);

    }

}