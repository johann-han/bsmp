import { Entity, ValueObject } from "@bsmp/shared";
import type { Passage } from "@bsmp/bible";

import type { SermonStudyContext } from "./StudyContext.js";

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
    readonly supportingObservationIds: readonly string[];
    readonly supportingInterpretationIds: readonly string[];
    readonly supportingEvidenceIds: readonly string[];
    readonly supportingApplicationIds: readonly string[];
    readonly explanation: string;
    readonly illustration: string;
    readonly application: string;
    readonly transition: string;
}

export class ExpositorySermon extends Entity<ExpositorySermonId> {
    private _title: SermonTitle;
    private readonly _passage: Passage;
    private _bigIdea?: SermonBigIdea;
    private _purpose?: SermonPurpose;
    private _outline: SermonOutlinePoint[] = [];
    private readonly _createdAt: Date;

    private constructor(
        id: ExpositorySermonId,
        title: SermonTitle,
        passage: Passage,
        createdAt: Date,
    ) {
        super(id);
        this._title = title;
        this._passage = passage;
        this._createdAt = createdAt;
    }

    public static create(
        id: ExpositorySermonId,
        title: SermonTitle,
        passage: Passage,
    ): ExpositorySermon {
        return new ExpositorySermon(id, title, passage, new Date());
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
            supportingObservationIds: [],
            supportingInterpretationIds: [],
            supportingEvidenceIds: [],
            supportingApplicationIds: [],
            explanation: "",
            illustration: "",
            application: "",
            transition: "",
        } satisfies SermonOutlinePoint;

        this._outline.push(point);
        return point;
    }

    public attachStudySupport(
        pointId: string,
        context: Pick<SermonStudyContext, "observations" | "interpretations" | "applications">,
        support: {
            readonly observationIds?: readonly string[];
            readonly interpretationIds?: readonly string[];
            readonly evidenceIds?: readonly string[];
            readonly applicationIds?: readonly string[];
        },
    ): void {
        const index = this._outline.findIndex((point) => point.id === pointId);
        if (index < 0) throw new Error("Sermon outline point not found.");

        const observationIds = new Set(context.observations.map((item) => item.id));
        const interpretationIds = new Set(context.interpretations.map((item) => item.id));
        const evidenceIds = new Set(context.interpretations.flatMap((item) => item.evidence.map((evidence) => evidence.id)));
        const applicationIds = new Set(context.applications.map((item) => item.id));

        const observations = [...(support.observationIds ?? [])];
        const interpretations = [...(support.interpretationIds ?? [])];
        const evidence = [...(support.evidenceIds ?? [])];
        const applications = [...(support.applicationIds ?? [])];

        if (observations.some((id) => !observationIds.has(id))) throw new Error("Outline point references an observation outside the originating study.");
        if (interpretations.some((id) => !interpretationIds.has(id))) throw new Error("Outline point references an interpretation outside the originating study.");
        if (evidence.some((id) => !evidenceIds.has(id))) throw new Error("Outline point references evidence outside the originating study.");
        if (applications.some((id) => !applicationIds.has(id))) throw new Error("Outline point references an application outside the originating study.");

        this._outline[index] = {
            ...this._outline[index],
            supportingObservationIds: [...new Set(observations)],
            supportingInterpretationIds: [...new Set(interpretations)],
            supportingEvidenceIds: [...new Set(evidence)],
            supportingApplicationIds: [...new Set(applications)],
        };
    }

    public defineOutlinePointExposition(
        pointId: string,
        exposition: {
            readonly explanation: string;
            readonly illustration: string;
            readonly application: string;
            readonly transition: string;
        },
    ): void {
        const index = this._outline.findIndex((point) => point.id === pointId);
        if (index < 0) throw new Error("Sermon outline point not found.");

        this._outline[index] = {
            ...this._outline[index],
            explanation: exposition.explanation.trim(),
            illustration: exposition.illustration.trim(),
            application: exposition.application.trim(),
            transition: exposition.transition.trim(),
        };
    }

    public get title(): SermonTitle {
        return this._title;
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
