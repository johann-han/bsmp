import { ValueObject } from "@bsmp/shared";

import { BookCode } from "./BookCode.js";
import { BookName } from "./BookName.js";

export interface BookMetadataProps {
    canonicalName: BookName;
    shortName: BookName;
    code: BookCode;
}

/**
 * Immutable metadata describing a Bible book.
 */
export class BookMetadata
    extends ValueObject<BookMetadataProps> {

    private constructor(
        props: BookMetadataProps,
    ) {
        super(props);
    }

    /**
     * Creates immutable metadata describing a Bible book.
     */
    public static create(
        props: BookMetadataProps,
    ): BookMetadata {
        return new BookMetadata(props);
    }

    /**
     * Gets the canonical name.
     */
    public get canonicalName(): BookName {
        return this.get("canonicalName");
    }

    /**
     * Gets the short display name.
     */
    public get shortName(): BookName {
        return this.get("shortName");
    }

    /**
     * Gets the unique book code.
     */
    public get code(): BookCode {
        return this.get("code");
    }
}