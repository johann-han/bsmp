import { Guard, ValueObject } from "@bsmp/shared";

type CanonicalOrderProps = {
    value: number;
};

export class CanonicalOrder extends ValueObject<CanonicalOrderProps> {
    private constructor(props: CanonicalOrderProps) {
        super(props);
    }

    public static of(value: number): CanonicalOrder {
        if (!Guard.isPositiveInteger(value)) {
            throw new Error(
                "Canonical order must be a positive integer.",
            );
        }

        return new CanonicalOrder({ value });
    }

    public get value(): number {
        return this.get("value");
    }
}