import { ValueObject } from "@bsmp/shared";

import {
    BibleBookId,
    ChapterNumber,
    VerseNumber,
} from "./index.js";

export interface BibleReferenceProps {
    book: BibleBookId;
    chapter: ChapterNumber;
    verse: VerseNumber;
}

/**
 * Represents a reference to a single verse in Scripture.
 */
export class BibleReference
    extends ValueObject<BibleReferenceProps> {

    private constructor(
        props: BibleReferenceProps,
    ) {
        super(props);
    }

    public static create(
        props: BibleReferenceProps,
    ): BibleReference {
        return new BibleReference(props);
    }

    public get book(): BibleBookId {
        return this.get("book");
    }

    public get chapter(): ChapterNumber {
        return this.get("chapter");
    }

    public get verse(): VerseNumber {
        return this.get("verse");
    }
}