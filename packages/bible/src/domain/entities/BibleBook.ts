import { Entity, Guard } from "@bsmp/shared";
import { BibleBookId } from "../value-objects/BibleBookId.js";
import { BibleBookProps } from "./BookDefinition.js";

import {
    BibleDivision,
    BookMetadata,
    CanonicalOrder,
    ChapterCount,
    Testament,
} from "../index.js";

/**
 * Represents a single book of the Bible.
 */
export class BibleBook extends Entity<BibleBookId> {

    private readonly _metadata: BookMetadata;
    private readonly _canonicalOrder: CanonicalOrder;
    private readonly _testament: Testament;
    private readonly _division: BibleDivision;
    private readonly _chapterCount: ChapterCount;

    private constructor(
        id: BibleBookId,
        props: BibleBookProps,
    ) {
        super(id);

        this._metadata = props.metadata;
        this._canonicalOrder = props.canonicalOrder;
        this._testament = props.testament;
        this._division = props.division;
        this._chapterCount = props.chapterCount;
    }

    public static create(
        id: BibleBookId,
        props: BibleBookProps,
    ): BibleBook {

        if (!Guard.isDefined(id)) {
            throw new Error("BibleBookId is required.");
        }

        if (!Guard.isDefined(props.metadata)) {
            throw new Error("Book metadata is required.");
        }

        if (!Guard.isDefined(props.canonicalOrder)) {
            throw new Error("Canonical order is required.");
        }

        if (!Guard.isDefined(props.testament)) {
            throw new Error("Testament is required.");
        }

        if (!Guard.isDefined(props.division)) {
            throw new Error("Bible division is required.");
        }

        if (!Guard.isDefined(props.chapterCount)) {
            throw new Error("Chapter count is required.");
        }

        return new BibleBook(id, props);
    }

    public get metadata(): BookMetadata {
        return this._metadata;
    }

    public get canonicalOrder(): CanonicalOrder {
        return this._canonicalOrder;
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