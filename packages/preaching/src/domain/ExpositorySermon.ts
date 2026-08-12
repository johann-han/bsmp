import { Entity, ValueObject } from "@bsmp/shared";
import type { Passage } from "@bsmp/bible";
import type { StudyId } from "@bsmp/study";

export class ExpositorySermonId extends ValueObject<{ value: string }> {
    public static create(value = crypto.randomUUID()): ExpositorySermonId {
        return new ExpositorySermonId({ value });
    }

    public get value(): string {
        return this.get("value");
    }
}

export class SermonTitle extends ValueObject<{ value: string }> {
    public static from(value: string): SermonTitle {
        const normalized = value.trim();
        if (!normalized) throw new Error("Sermon title cannot be empty.");
        return new SermonTitle({ value: normalized });
    }

    public get value(): string {
        return this.get("value");
    }
}

export class SermonBigIdea extends ValueObject<{ value: string }> {
    public static from(value: string): SermonBigIdea {
        const normalized = value.trim();
        if (!normalized) throw new Error("Sermon big idea cannot be empty.");
        return new SermonBigIdea({ value: normalized });
    }

    public get value(): string {
        return this.get("value");
    }
}

export class SermonPurpose extends ValueObject<{ value: string }> {
    public static from(value: string): SermonPurpose {
        const normalized = value.trim();
        if (!normalized) throw new Error("Sermon purpose cannot be empty.");
        return new SermonPurpose({ value: normalized });
    }

    public get value(): string {
        return this.get("value");
    }
}

export interface SermonOutlinePoint {
    readonly id: string;
    readonly heading: string;
    readonly truth: string;
}

export class ExpositorySermon extends Entity<ExpositorySermonId> {
    private _title: SermonTitle;
    private readonly _studyId: StudyId;
    private readonly _passage: Passage;
    private _bigIdea?: SermonBigIdea;
    private _purpose?: SermonPurpose;
    private _outline: SermonOutlinePoint[] = [];
    private readonly _createdAt: Date;

    private constructor(
        id: ExpositorySermonId,
        studyId: StudyId,
        title: SermonTitle,
        passage: Passage,
        createdAt: Date,
    ) {
        super(id);
        this._title = title;
        this._studyId = studyId;
        this._passage = passage;
        this._createdAt = createdAt;
    }

    public static create(
        id: ExpositorySermonId,
        studyId: StudyId,
        title: SermonTitle,
        passage: Passage,
    ): ExpositorySermon {
        return new ExpositorySermon(id, studyId, title, passage, new Date());
    }

    public reviseTitle(title: SermonTitle): void {
        this._title = title;
    }

    public defineBigIdea(bigIdea: SermonBigIdea): void {
        this._bigIdea = bigIdea;
    }

    public definePurpose(purpose: SermonPurpose): void {
        this._purpose = purpose;
    }

    public addOutlinePoint(heading: string, truth: string): SermonOutlinePoint {
        const normalizedHeading = heading.trim();
        const normalizedTruth = truth.trim();
        if (!normalizedHeading || !normalizedTruth) {
            throw new Error("An outline point requires both a heading and truth statement.");
        }

        const point = {
            id: crypto.randomUUID(),
            heading: normalizedHeading,
            truth: normalizedTruth,
        } satisfies SermonOutlinePoint;

        this._outline.push(point);
        return point;
    }

    public get title(): SermonTitle {
        return this._title;
    }

    public get studyId(): StudyId {
        return this._studyId;
    }

    public get passage(): Passage {
        return this._passage;
    }

    public get bigIdea(): SermonBigIdea | undefined {
        return this._bigIdea;
    }

    public get purpose(): SermonPurpose | undefined {
        return this._purpose;
    }

    public get outline(): readonly SermonOutlinePoint[] {
        return this._outline;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }
}
