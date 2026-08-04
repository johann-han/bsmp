import {
    ValidationError,
    ValueObject,
} from "@bsmp/shared";

interface InterpretationStatementProps {

    value: string;

}

export class InterpretationStatement
    extends ValueObject<InterpretationStatementProps> {

    public static from(
        value: string,
    ): InterpretationStatement {

        const trimmed = value.trim();

        if (!trimmed) {

            throw new ValidationError(
                "Interpretation statement cannot be empty.",
            );

        }

        return new InterpretationStatement({
            value: trimmed,
        });

    }

    public get value(): string {

        return this.get("value");

    }

}