import { AggregateRoot } from "@bsmp/shared";

import { Passage } from "@bsmp/bible";

import { Application } from "../entities/Application.js";
import { BiblicalTheology } from "../entities/BiblicalTheology.js";
import { Observation } from "../entities/Observation.js";
import { Interpretation } from "../entities/Interpretation.js";

import {
    BiblicalTheologyId,
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
    ObservationId,
    StudyId,
    StudyStatus,
    StudyTitle,
} from "../value-objects/index.js";

export class StudySession extends AggregateRoot<StudyId> {
    private readonly _title: StudyTitle;
    private readonly _passage: Passage;
    private readonly _status: StudyStatus;
    private readonly _createdAt: Date;
    private readonly _observations: Observation[];
    private readonly _interpretations: Interpretation[];
    private readonly _applications: Application[];
    private readonly _biblicalTheology: BiblicalTheology[];

    private constructor(id: StudyId, title: StudyTitle, passage: Passage, status: StudyStatus, createdAt: Date, observations: Observation[], interpretations: Interpretation[], applications: Application[], biblicalTheology: BiblicalTheology[]) {
        super(id);
        this._title = title;
        this._passage = passage;
        this._status = status;
        this._createdAt = createdAt;
        this._observations = observations;
        this._interpretations = interpretations;
        this._applications = applications;
        this._biblicalTheology = biblicalTheology;
    }

    public static create(id: StudyId, title: StudyTitle, passage: Passage): StudySession {
        return new StudySession(id, title, passage, StudyStatus.draft(), new Date(), [], [], [], []);
    }

    public addObservation(observation: Observation): void { this._observations.push(observation); }

    public updateObservation(observationId: ObservationId, statement: import("../value-objects/ObservationStatement.js").ObservationStatement, target: import("../value-objects/ObservationTarget.js").ObservationTarget): void {
        const observation = this._observations.find((item) => item.id.value === observationId.value);
        if (!observation) throw new Error(`Observation not found: ${observationId.value}`);
        observation.edit(statement, target);
    }

    public removeObservation(observationId: ObservationId): void {
        const index = this._observations.findIndex((item) => item.id.value === observationId.value);
        if (index === -1) throw new Error(`Observation not found: ${observationId.value}`);
        if (this._interpretations.some((interpretation) => interpretation.observationIds.some((id) => id.value === observationId.value))) {
            throw new Error("Cannot delete an observation that supports an interpretation.");
        }
        this._observations.splice(index, 1);
    }

    public addInterpretation(interpretation: Interpretation): void { this._interpretations.push(interpretation); }

    public updateEvidence(interpretationId: import("../value-objects/InterpretationId.js").InterpretationId, evidenceId: EvidenceId, type: EvidenceType, description: EvidenceDescription): void {
        const interpretation = this._interpretations.find((item) => item.id.value === interpretationId.value);
        if (!interpretation) throw new Error(`Interpretation not found: ${interpretationId.value}`);
        interpretation.updateEvidence(evidenceId, type, description);
    }

    public addApplication(application: Application): void { this._applications.push(application); }

    public removeApplication(applicationId: import("../value-objects/ApplicationId.js").ApplicationId): void {
        const index = this._applications.findIndex((item) => item.id.value === applicationId.value);
        if (index === -1) throw new Error(`Application not found: ${applicationId.value}`);
        this._applications.splice(index, 1);
    }

    public addBiblicalTheology(entry: BiblicalTheology): void { this._biblicalTheology.push(entry); }

    public updateBiblicalTheology(id: BiblicalTheologyId, theme: string, synthesis: string, interpretationIds: readonly import("../value-objects/InterpretationId.js").InterpretationId[]): void {
        const entry = this._biblicalTheology.find((item) => item.id.value === id.value);
        if (!entry) throw new Error(`Biblical theology entry not found: ${id.value}`);
        entry.revise(theme, synthesis, interpretationIds);
    }

    public removeBiblicalTheology(id: BiblicalTheologyId): void {
        const index = this._biblicalTheology.findIndex((item) => item.id.value === id.value);
        if (index === -1) throw new Error(`Biblical theology entry not found: ${id.value}`);
        this._biblicalTheology.splice(index, 1);
    }

    public get title(): StudyTitle { return this._title; }
    public get passage(): Passage { return this._passage; }
    public get status(): StudyStatus { return this._status; }
    public get createdAt(): Date { return this._createdAt; }
    public get observations(): readonly Observation[] { return this._observations; }
    public get interpretations(): readonly Interpretation[] { return this._interpretations; }
    public get applications(): readonly Application[] { return this._applications; }
    public get biblicalTheology(): readonly BiblicalTheology[] { return this._biblicalTheology; }
}