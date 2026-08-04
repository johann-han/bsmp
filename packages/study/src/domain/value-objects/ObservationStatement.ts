import {
    ValidationError,
    ValueObject,
} from "@bsmp/shared";

interface ObservationStatementProps {

    value: string;

}

export class ObservationStatement
    extends ValueObject<ObservationStatementProps> {

    public static from(
        value: string,
    ): ObservationStatement {

        const trimmed = value.trim();

        if (!trimmed) {

            throw new ValidationError(
                "Observation statement cannot be empty.",
            );

        }

        return new ObservationStatement({
            value: trimmed,
        });

    }

    public get value(): string {

        return this.get("value");

    }

}