import { ValueObject } from "@bsmp/shared";

import { BibleReference } from "./BibleReference.js";

export interface VerseRangeProps {
    start: BibleReference;
    end: BibleReference;
}

/**
 * Represents a contiguous range of verses.
 */
export class VerseRange
    extends ValueObject<VerseRangeProps> {

    private constructor(
        props: VerseRangeProps,
    ) {
        super(props);
    }

    public static create(
        props: VerseRangeProps,
    ): VerseRange {
        return new VerseRange(props);
    }

    public get start(): BibleReference {
        return this.value.start;
    }

    public get end(): BibleReference {
        return this.value.end;
    }
}