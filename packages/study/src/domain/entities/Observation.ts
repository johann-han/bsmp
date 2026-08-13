import { Entity } from "@bsmp/shared";

import { Evidence } from "./Evidence.js";

import {
    ObservationId,
    ObservationStatement,
    ObservationTarget,
    ObservationVerseReference,
} from "../value-objects/index.js";

export class Observation extends Entity<ObservationId> {
    private _statement: ObservationStatement;
    private _verseReference: ObservationVerseReference;
    private _target: ObservationTarget;
    private readonly _createdAt: Date;
    private readonly _evidence: Evidence[];

    private constructor(
        id: ObservationId,
        statement: ObservationStatement,
        target: ObservationTarget,
        createdAt: Date,
        evidence: Evidence[],
    ) {
        super(id);
        this._statement = statement;
        this._verseReference = ObservationVerseReference.from(target.verseReference);
        this._target = target;
        this._createdAt = createdAt;
        this._evidence = evidence;
    }

    public static create(
        id: ObservationId,
        statement: ObservationStatement,
        verseReference: ObservationVerseReference,
        target: ObservationTarget = ObservationTarget.verse(verseReference.value),
    ): Observation {
        return new Observation(id, statement, target, new Date(), []);
    }

    public static rehydrate(
        id: ObservationId,
        statement: ObservationStatement,
        verseReference: ObservationVerseReference,
        createdAt: Date,
        target: ObservationTarget = ObservationTarget.verse(verseReference.value),
    ): Observation {
        return new Observation(id, statement, target, createdAt, []);
    }

    public edit(statement: ObservationStatement, target: ObservationTarget): void {
        this._statement = statement;
        this._target = target;
        this._verseReference = ObservationVerseReference.from(target.verseReference);
    }

    public addEvidence(evidence: Evidence): void {
        this._evidence.push(evidence);
    }

    public get statement(): ObservationStatement {
        return this._statement;
    }

    public get verseReference(): ObservationVerseReference {
        return this._verseReference;
    }

    public get target(): ObservationTarget {
        return this._target;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public get evidence(): readonly Evidence[] {
        return this._evidence;
    }
}
