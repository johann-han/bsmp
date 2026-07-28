import { Guard, Identifier } from "@bsmp/shared";

export const CanonIds = {
    Protestant: "protestant",
    Catholic: "catholic",
    Orthodox: "orthodox",
    Hebrew: "hebrew",
} as const;

export type CanonIdValue =
    (typeof CanonIds)[keyof typeof CanonIds];

/**
 * Strongly typed identifier for a Bible canon.
 */
export class CanonId extends Identifier<CanonIdValue> {

    private constructor(value: CanonIdValue) {
        super(value);
    }

    public static from(value: string): CanonId {
        if (!Guard.isNonEmptyString(value)) {
            throw new Error("Canon ID must be a non-empty string.");
        }

        const normalized = value.trim().toLowerCase();

        const values = Object.values(CanonIds);

        if (!values.includes(normalized as CanonIdValue)) {
            throw new Error(`Unsupported canon ID: ${value}`);
        }

        return new CanonId(normalized as CanonIdValue);
    }

    public static protestant(): CanonId {
        return new CanonId(CanonIds.Protestant);
    }

    public static catholic(): CanonId {
        return new CanonId(CanonIds.Catholic);
    }

    public static orthodox(): CanonId {
        return new CanonId(CanonIds.Orthodox);
    }

    public static hebrew(): CanonId {
        return new CanonId(CanonIds.Hebrew);
    }

    /**
     * Convenience alias for the identifier value.
     */
    public get code(): CanonIdValue {
        return this.value;
    }
}