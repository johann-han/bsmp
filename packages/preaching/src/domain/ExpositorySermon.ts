import { Entity, ValueObject } from "@bsmp/shared";
import type { Passage } from "@bsmp/bible";
import type { StudyId } from "@bsmp/study";

export class ExpositorySermonId extends ValueObject<{ value: string }> {
    public static create(value = crypto.randomUUID()): ExpositorySermonId { return new ExpositorySermonId({ value }); }
    public get value(): string { return this.get("value"); }
}
export class SermonTitle extends ValueObject<{ value: string }> {
    public static from(value: string): SermonTitle { const normalized = value.trim(); if (!normalized) throw new Error("Sermon title cannot be empty."); return new SermonTitle({ value: normalized }); }
    public get value(): string { return this.get("value"); }
}
export class SermonBigIdea extends ValueObject<{ value: string }> {
    public static from(value: string): SermonBigIdea { const normalized = value.trim(); if (!normalized) throw new Error("Sermon big idea cannot be empty."); return new SermonBigIdea({ value: normalized }); }
    public get value(): string { return this.get("value"); }
}
export class SermonPurpose extends ValueObject<{ value: string }> {
    public static from(value: string): SermonPurpose { const normalized = value.trim(); if (!normalized) throw new Error("Sermon purpose cannot be empty."); return new SermonPurpose({ value: normalized }); }
    public get value(): string { return this.get("value"); }
}
export class SermonIntroduction extends ValueObject<{ value: string }> {
    public static from(value: string): SermonIntroduction { return new SermonIntroduction({ value: value.trim() }); }
    public get value(): string { return this.get("value"); }
}
export class SermonContext extends ValueObject<{ value: string }> {
    public static from(value: string): SermonContext { return new SermonContext({ value: value.trim() }); }
    public get value(): string { return this.get("value"); }
}
export class SermonConclusion extends ValueObject<{ value: string }> {
    public static from(value: string): SermonConclusion { return new SermonConclusion({ value: value.trim() }); }
    public get value(): string { return this.get("value"); }
}

export interface SermonOutlinePoint {
    readonly id: string;
    readonly heading: string;
    readonly truth: string;
    readonly text: string;
    readonly explanation: string;
    readonly illustration: string;
    readonly application: string;
    readonly transition: string;
    readonly textObservationIds: readonly string[];
    readonly meaningInterpretationIds: readonly string[];
    readonly meaningEvidenceIds: readonly string[];
    readonly responseApplicationIds: readonly string[];
    readonly supportingObservationIds: readonly string[];
    readonly supportingInterpretationIds: readonly string[];
    readonly supportingEvidenceIds: readonly string[];
    readonly supportingApplicationIds: readonly string[];
}
export interface SermonOutlineSupport {
    readonly supportingObservationIds?: readonly string[];
    readonly supportingInterpretationIds?: readonly string[];
    readonly supportingEvidenceIds?: readonly string[];
    readonly supportingApplicationIds?: readonly string[];
}
export interface SermonOutlineExposition {
    readonly text?: string;
    readonly explanation?: string;
    readonly illustration?: string;
    readonly application?: string;
    readonly transition?: string;
    readonly textObservationIds?: readonly string[];
    readonly meaningInterpretationIds?: readonly string[];
    readonly meaningEvidenceIds?: readonly string[];
    readonly responseApplicationIds?: readonly string[];
}

export class ExpositorySermon extends Entity<ExpositorySermonId> {
    private _title: SermonTitle;
    private readonly _studyId: StudyId;
    private readonly _passage: Passage;
    private _bigIdea?: SermonBigIdea;
    private _purpose?: SermonPurpose;
    private _introduction?: SermonIntroduction;
    private _context?: SermonContext;
    private _conclusion?: SermonConclusion;
    private _outline: SermonOutlinePoint[] = [];
    private readonly _createdAt: Date;

    private constructor(id: ExpositorySermonId, studyId: StudyId, title: SermonTitle, passage: Passage, createdAt: Date) {
        super(id); this._title = title; this._studyId = studyId; this._passage = passage; this._createdAt = createdAt;
    }
    public static create(id: ExpositorySermonId, studyId: StudyId, title: SermonTitle, passage: Passage): ExpositorySermon { return new ExpositorySermon(id, studyId, title, passage, new Date()); }
    public reviseTitle(title: SermonTitle): void { this._title = title; }
    public defineBigIdea(bigIdea: SermonBigIdea): void { this._bigIdea = bigIdea; }
    public definePurpose(purpose: SermonPurpose): void { this._purpose = purpose; }
    public defineIntroduction(introduction: SermonIntroduction): void { this._introduction = introduction; }
    public defineContext(context: SermonContext): void { this._context = context; }
    public defineConclusion(conclusion: SermonConclusion): void { this._conclusion = conclusion; }

    public addOutlinePoint(heading: string, truth: string, support: SermonOutlineSupport = {}, id = crypto.randomUUID(), exposition: SermonOutlineExposition = {}): SermonOutlinePoint {
        const normalizedHeading = heading.trim(); const normalizedTruth = truth.trim();
        if (!normalizedHeading || !normalizedTruth) throw new Error("An outline point requires both a heading and truth statement.");
        const normalizedSupport = {
            supportingObservationIds: [...(support.supportingObservationIds ?? [])],
            supportingInterpretationIds: [...(support.supportingInterpretationIds ?? [])],
            supportingEvidenceIds: [...(support.supportingEvidenceIds ?? [])],
            supportingApplicationIds: [...(support.supportingApplicationIds ?? [])],
        };
        const normalizedExposition = {
            text: exposition.text?.trim() ?? "",
            explanation: exposition.explanation?.trim() ?? "",
            illustration: exposition.illustration?.trim() ?? "",
            application: exposition.application?.trim() ?? "",
            transition: exposition.transition?.trim() ?? "",
            textObservationIds: [...(exposition.textObservationIds ?? [])],
            meaningInterpretationIds: [...(exposition.meaningInterpretationIds ?? [])],
            meaningEvidenceIds: [...(exposition.meaningEvidenceIds ?? [])],
            responseApplicationIds: [...(exposition.responseApplicationIds ?? [])],
        };
        const duplicate = this._outline.some((point) => point.heading === normalizedHeading && point.truth === normalizedTruth && JSON.stringify(point.supportingObservationIds) === JSON.stringify(normalizedSupport.supportingObservationIds) && JSON.stringify(point.supportingInterpretationIds) === JSON.stringify(normalizedSupport.supportingInterpretationIds) && JSON.stringify(point.supportingEvidenceIds) === JSON.stringify(normalizedSupport.supportingEvidenceIds) && JSON.stringify(point.supportingApplicationIds) === JSON.stringify(normalizedSupport.supportingApplicationIds));
        if (duplicate) throw new Error("This outline point is already part of the sermon.");
        const point = { id, heading: normalizedHeading, truth: normalizedTruth, ...normalizedExposition, ...normalizedSupport } satisfies SermonOutlinePoint;
        this._outline.push(point); return point;
    }

    public updateOutlinePoint(id: string, heading: string, truth: string, support: SermonOutlineSupport = {}, exposition: SermonOutlineExposition = {}): SermonOutlinePoint {
        const index = this._outline.findIndex((point) => point.id === id); if (index < 0) throw new Error("Outline point was not found.");
        const normalizedHeading = heading.trim(); const normalizedTruth = truth.trim();
        if (!normalizedHeading || !normalizedTruth) throw new Error("An outline point requires both a heading and truth statement.");
        const current = this._outline[index]; if (!current) throw new Error("Outline point was not found.");
        const updated = {
            id, heading: normalizedHeading, truth: normalizedTruth,
            text: exposition.text?.trim() ?? current.text,
            explanation: exposition.explanation?.trim() ?? current.explanation,
            illustration: exposition.illustration?.trim() ?? current.illustration,
            application: exposition.application?.trim() ?? current.application,
            transition: exposition.transition?.trim() ?? current.transition,
            textObservationIds: [...(exposition.textObservationIds ?? current.textObservationIds)],
            meaningInterpretationIds: [...(exposition.meaningInterpretationIds ?? current.meaningInterpretationIds)],
            meaningEvidenceIds: [...(exposition.meaningEvidenceIds ?? current.meaningEvidenceIds)],
            responseApplicationIds: [...(exposition.responseApplicationIds ?? current.responseApplicationIds)],
            supportingObservationIds: [...(support.supportingObservationIds ?? [])],
            supportingInterpretationIds: [...(support.supportingInterpretationIds ?? [])],
            supportingEvidenceIds: [...(support.supportingEvidenceIds ?? [])],
            supportingApplicationIds: [...(support.supportingApplicationIds ?? [])],
        } satisfies SermonOutlinePoint;
        this._outline[index] = updated; return updated;
    }

    public defineOutlinePointExposition(id: string, exposition: SermonOutlineExposition): SermonOutlinePoint {
        const index = this._outline.findIndex((point) => point.id === id); if (index < 0) throw new Error("Outline point was not found.");
        const current = this._outline[index]; if (!current) throw new Error("Outline point was not found.");
        const updated = {
            ...current,
            text: exposition.text?.trim() ?? current.text,
            explanation: exposition.explanation?.trim() ?? current.explanation,
            illustration: exposition.illustration?.trim() ?? current.illustration,
            application: exposition.application?.trim() ?? current.application,
            transition: exposition.transition?.trim() ?? current.transition,
            textObservationIds: exposition.textObservationIds ? [...exposition.textObservationIds] : current.textObservationIds,
            meaningInterpretationIds: exposition.meaningInterpretationIds ? [...exposition.meaningInterpretationIds] : current.meaningInterpretationIds,
            meaningEvidenceIds: exposition.meaningEvidenceIds ? [...exposition.meaningEvidenceIds] : current.meaningEvidenceIds,
            responseApplicationIds: exposition.responseApplicationIds ? [...exposition.responseApplicationIds] : current.responseApplicationIds,
        } satisfies SermonOutlinePoint;
        this._outline[index] = updated; return updated;
    }

    public removeOutlinePoint(id: string): void { const index = this._outline.findIndex((point) => point.id === id); if (index < 0) throw new Error("Outline point was not found."); this._outline.splice(index, 1); }
    public moveOutlinePoint(id: string, direction: "up" | "down"): void {
        const index = this._outline.findIndex((point) => point.id === id); if (index < 0) throw new Error("Outline point was not found.");
        const targetIndex = direction === "up" ? index - 1 : index + 1; if (targetIndex < 0 || targetIndex >= this._outline.length) return;
        const current = this._outline[index]; const target = this._outline[targetIndex]; if (!current || !target) throw new Error("Outline point could not be moved.");
        this._outline[index] = target; this._outline[targetIndex] = current;
    }
    public get title(): SermonTitle { return this._title; }
    public get studyId(): StudyId { return this._studyId; }
    public get passage(): Passage { return this._passage; }
    public get bigIdea(): SermonBigIdea | undefined { return this._bigIdea; }
    public get purpose(): SermonPurpose | undefined { return this._purpose; }
    public get introduction(): SermonIntroduction | undefined { return this._introduction; }
    public get context(): SermonContext | undefined { return this._context; }
    public get conclusion(): SermonConclusion | undefined { return this._conclusion; }
    public get outline(): readonly SermonOutlinePoint[] { return this._outline; }
    public get createdAt(): Date { return this._createdAt; }
}
