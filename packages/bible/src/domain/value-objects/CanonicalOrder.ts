import { Guard, ValueObject } from "@bsmp/shared";

export class CanonicalOrder extends ValueObject<number> {
    private constructor(value: number) {
        super(value);
    }

    public static from(value: number): CanonicalOrder {
        if (!Guard.isPositiveInteger(value)) {
            throw new Error(
                "Canonical order must be a positive integer.",
            );
        }

        return new CanonicalOrder(value);
    }

    public get value(): number {
        return super.value;
    }
}