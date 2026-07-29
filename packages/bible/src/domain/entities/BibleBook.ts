import {
    Entity,
    Guard,
    ValidationError,
} from "@bsmp/shared";

import { BibleBookId } from "../value-objects/BibleBookId.js";
import { BibleBookProps } from "./BookDefinition.js";

import {
    BibleDivision,
    BookCode,
    BookMetadata,
    BookName,
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

        Object.freeze(this);
    }

    /**
     * Creates a BibleBook.
     */
    public static create(
        id: BibleBookId,
        props: BibleBookProps,
    ): BibleBook {

        if (!Guard.isDefined(id)) {
            throw new ValidationError(
                "BibleBookId is required.",
            );
        }

        if (!Guard.isDefined(props.metadata)) {
            throw new ValidationError(
                "Book metadata is required.",
            );
        }

        if (!Guard.isDefined(props.canonicalOrder)) {
            throw new ValidationError(
                "Canonical order is required.",
            );
        }

        if (!Guard.isDefined(props.testament)) {
            throw new ValidationError(
                "Testament is required.",
            );
        }

        if (!Guard.isDefined(props.division)) {
            throw new ValidationError(
                "Bible division is required.",
            );
        }

        if (!Guard.isDefined(props.chapterCount)) {
            throw new ValidationError(
                "Chapter count is required.",
            );
        }

        return new BibleBook(id, props);
    }

    /**
     * Gets the complete metadata.
     */
    public get metadata(): BookMetadata {
        return this._metadata;
    }

    /**
     * Gets the canonical book name.
     */
    public get name(): BookName {
        return this._metadata.canonicalName;
    }

    /**
     * Gets the unique book code.
     */
    public get code(): BookCode {
        return this._metadata.code;
    }

    /**
     * Gets the canonical order.
     */
    public get canonicalOrder(): CanonicalOrder {
        return this._canonicalOrder;
    }

    /**
     * Gets the testament.
     */
    public get testament(): Testament {
        return this._testament;
    }

    /**
     * Gets the literary division.
     */
    public get division(): BibleDivision {
        return this._division;
    }

    /**
     * Gets the number of chapters.
     */
    public get chapterCount(): ChapterCount {
        return this._chapterCount;
    }
}