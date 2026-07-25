import { ValueObject } from "@bsmp/shared";

export interface BookMetadataProps {
    canonicalName: string;
    shortName: string;
    abbreviation: string;
    osisCode: string;
}

import { ValidationError } from "@bsmp/shared";

export class BookMetadata extends ValueObject<BookMetadataProps> {
    private constructor(props: BookMetadataProps) {
        super(props);

        this.validate(props);
    }

    public static from(props: BookMetadataProps): BookMetadata {
        return new BookMetadata(props);
    }

    public get canonicalName(): string {
        return this.value.canonicalName;
    }

    public get shortName(): string {
        return this.value.shortName;
    }

    public get abbreviation(): string {
        return this.value.abbreviation;
    }

    public get osisCode(): string {
        return this.value.osisCode;
    }

    private validate(props: BookMetadataProps): void {
        const values = [
            props.canonicalName,
            props.shortName,
            props.abbreviation,
            props.osisCode,
        ];

        for (const value of values) {
            if (value.trim().length === 0) {
                throw new ValidationError(
                    "Book metadata fields cannot be empty.",
                );
            }
        }
    }
}