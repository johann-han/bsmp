import { VerseReference } from "@bsmp/bible";

export class ObservationVerseReference {

    private constructor(
        public readonly value: VerseReference,
    ) { }

    public static from(
        value: VerseReference,
    ): ObservationVerseReference {
        return new ObservationVerseReference(value);
    }

    public toString(): string {
        return this.value.toString();
    }

}