import { Identifier } from "@bsmp/shared";

export class EvidenceId
    extends Identifier<string> {

    public static create(): EvidenceId {

        return new EvidenceId(
            crypto.randomUUID(),
        );

    }

    public static from(
        value: string,
    ): EvidenceId {

        return new EvidenceId(value);

    }

}