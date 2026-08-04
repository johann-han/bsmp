import { Identifier } from "@bsmp/shared";

export class StudyId extends Identifier<string> {

    public static create(): StudyId {

        return new StudyId(
            crypto.randomUUID(),
        );

    }

    public static from(
        value: string,
    ): StudyId {

        return new StudyId(value);

    }

}