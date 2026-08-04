import { Identifier } from "@bsmp/shared";

export class ObservationId
    extends Identifier<string> {

    public static create(): ObservationId {

        return new ObservationId(
            crypto.randomUUID(),
        );

    }

    public static from(
        value: string,
    ): ObservationId {

        return new ObservationId(value);

    }

}