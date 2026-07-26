import { Guard, ValueObject } from "@bsmp/shared";

const CANON_IDS = [
    "protestant",
    "catholic",
    "orthodox",
    "hebrew",
] as const;

type CanonIdValue = typeof CANON_IDS[number];

export class CanonId extends ValueObject<CanonIdValue> {
    private constructor(value: CanonIdValue) {
        super(value);
    }

    public static from(value: string): CanonId {
        if (!Guard.isNonEmptyString(value)) {
            throw new Error("Canon ID must be a non-empty string.");
        }

        const normalized = value.trim().toLowerCase();

        if (!CANON_IDS.includes(normalized as CanonIdValue)) {
            throw new Error(`Unsupported canon ID: ${value}`);
        }

        return new CanonId(normalized as CanonIdValue);
    }

    public static protestant(): CanonId {
        return new CanonId("protestant");
    }

    public static catholic(): CanonId {
        return new CanonId("catholic");
    }

    public static orthodox(): CanonId {
        return new CanonId("orthodox");
    }

    public static hebrew(): CanonId {
        return new CanonId("hebrew");
    }

    public get value(): CanonIdValue {
        return super.value;
    }
}