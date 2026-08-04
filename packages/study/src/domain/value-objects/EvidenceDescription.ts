import {
    ValidationError,
    ValueObject,
} from "@bsmp/shared";

interface EvidenceDescriptionProps {

    value: string;

}

export class EvidenceDescription
    extends ValueObject<EvidenceDescriptionProps> {

    public static from(
        value: string,
    ): EvidenceDescription {

        const trimmed = value.trim();

        if (!trimmed) {

            throw new ValidationError(
                "Evidence description cannot be empty.",
            );

        }

        return new EvidenceDescription({
            value: trimmed,
        });

    }

    public get value(): string {

        return this.get("value");

    }

}