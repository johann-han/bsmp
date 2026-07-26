import { Guard, ValueObject } from "@bsmp/shared";

export interface CanonMetadataProps {
    displayName: string;
    shortName: string;
    description: string;
}

/**
 * Descriptive metadata for a biblical canon.
 */
export class CanonMetadata
    extends ValueObject<CanonMetadataProps> {

    private constructor(
        props: CanonMetadataProps,
    ) {
        super(props);
    }

    public static create(
        props: CanonMetadataProps,
    ): CanonMetadata {

        if (!Guard.isNonEmptyString(props.displayName)) {
            throw new Error(
                "Display name must be a non-empty string.",
            );
        }

        if (!Guard.isNonEmptyString(props.shortName)) {
            throw new Error(
                "Short name must be a non-empty string.",
            );
        }

        if (!Guard.isNonEmptyString(props.description)) {
            throw new Error(
                "Description must be a non-empty string.",
            );
        }

        return new CanonMetadata({
            displayName: props.displayName.trim(),
            shortName: props.shortName.trim(),
            description: props.description.trim(),
        });
    }

    public get displayName(): string {
        return this.value.displayName;
    }

    public get shortName(): string {
        return this.value.shortName;
    }

    public get description(): string {
        return this.value.description;
    }
}