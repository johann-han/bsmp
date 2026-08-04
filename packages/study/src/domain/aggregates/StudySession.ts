import { AggregateRoot } from "@bsmp/shared";

import { Observation } from "../entities/Observation.js";

import {
    StudyId,
    StudyStatus,
    StudyTitle,
} from "../value-objects/index.js";

import { Interpretation } from "../entities/Interpretation.js";

export class StudySession
    extends AggregateRoot<StudyId> {

    private readonly _title: StudyTitle;

    private readonly _status: StudyStatus;

    private readonly _createdAt: Date;

    private readonly _observations: Observation[];

    private readonly _interpretations: Interpretation[];

    private constructor(
        id: StudyId,
        title: StudyTitle,
        status: StudyStatus,
        createdAt: Date,
        observations: Observation[],
        interpretations: Interpretation[],
    ) {
        super(id);

        this._title = title;
        this._status = status;
        this._createdAt = createdAt;
        this._observations = observations;
        this._interpretations = interpretations;
    }

    public static create(
        id: StudyId,
        title: StudyTitle,
    ): StudySession {

        return new StudySession(
            id,
            title,
            StudyStatus.draft(),
            new Date(),
            [],
            [],
        );

    }

    

    public addObservation(
        observation: Observation,
    ): void {

        this._observations.push(
            observation,
        );

    }
    

    public get title(): StudyTitle {

        return this._title;

    }

    public get status(): StudyStatus {

        return this._status;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

    public get observations(): readonly Observation[] {

        return this._observations;

    }

    public addInterpretation(
        interpretation: Interpretation,
    ): void {

        this._interpretations.push(
            interpretation,
        );

    }

    public get interpretations(): readonly Interpretation[] {

        return this._interpretations;

    }

    

}