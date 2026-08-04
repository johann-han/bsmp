import { Identifier } from "@bsmp/shared";

export class InterpretationId
    extends Identifier<string> {

    public static create(): InterpretationId {

        return new InterpretationId(
            crypto.randomUUID(),
        );

    }

    public static from(
        value: string,
    ): InterpretationId {

        return new InterpretationId(value);

    }

}