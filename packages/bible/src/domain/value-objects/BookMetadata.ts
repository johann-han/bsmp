import { ValueObject } from "@bsmp/shared";
import { BookName } from "./BookName.js";

export interface BookMetadataProps {
    canonicalName: BookName;
    shortName: BookName;
    abbreviation: BookName;
}

/**
 * Immutable metadata describing a Bible book.
 */
export class BookMetadata extends ValueObject<BookMetadataProps> {
    private constructor(props: BookMetadataProps) {
        super(props);
    }

    public static create(props: BookMetadataProps): BookMetadata {
        return new BookMetadata(props);
    }

    public get canonicalName(): BookName {
        return this.value.canonicalName;
    }

    public get shortName(): BookName {
        return this.value.shortName;
    }

    public get abbreviation(): BookName {
        return this.value.abbreviation;
    }
}