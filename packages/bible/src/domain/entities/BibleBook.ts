import { Entity } from "@bsmp/shared";

import { BibleDivision } from "../classification/BibleDivision.js";
import { Testament } from "../classification/Testament.js";

import {
    BibleBookId,
    BookMetadata,
    ChapterCount,
} from "../value-objects/index.js";

export interface BibleBookProps {
    id: BibleBookId;
    metadata: BookMetadata;
    testament: Testament;
    division: BibleDivision;
    chapterCount: ChapterCount;
}

/**
 * Represents a single book of the Bible.
 */
export class BibleBook extends Entity<BibleBookId> {
    private readonly _metadata: BookMetadata;
    private readonly _testament: Testament;
    private readonly _division: BibleDivision;
    private readonly _chapterCount: ChapterCount;

    private constructor(props: BibleBookProps) {
        super(props.id);

        this._metadata = props.metadata;
        this._testament = props.testament;
        this._division = props.division;
        this._chapterCount = props.chapterCount;
    }

    public static create(props: BibleBookProps): BibleBook {
        return new BibleBook(props);
    }

    public get metadata(): BookMetadata {
        return this._metadata;
    }

    public get testament(): Testament {
        return this._testament;
    }

    public get division(): BibleDivision {
        return this._division;
    }

    public get chapterCount(): ChapterCount {
        return this._chapterCount;
    }
}