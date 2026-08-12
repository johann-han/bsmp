import { Entity } from "@bsmp/shared";

import {
    InterpretationId,
    InterpretationStatement,
    ObservationId,
} from "../value-objects/index.js";

import type { Evidence } from "./Evidence.js";

export class Interpretation
    extends Entity<InterpretationId> {

    private _statement: InterpretationStatement;

    private _observationIds: ObservationId[];

    private readonly _evidence: Evidence[];

    private readonly _createdAt: Date;

    private constructor(
        id: InterpretationId,
        statement: InterpretationStatement,
        observationIds: readonly ObservationId[],
        evidence: readonly Evidence[],
        createdAt: Date,
    ) {
        super(id);
        this._statement = statement;
        this._observationIds = [...observationIds];
        this._evidence = [...evidence];
        this._createdAt = createdAt;
    }

    public static create(
        id: InterpretationId,
        statement: InterpretationStatement,
        observationIds: readonly ObservationId[] = [],
        evidence: readonly Evidence[] = [],
    ): Interpretation {
        return new Interpretation(
            id,
            statement,
            observationIds,
            evidence,
            new Date(),
        );
    }

    public revise(
        statement: InterpretationStatement,
        observationIds: readonly ObservationId[],
    ): void {
        this._statement = statement;
        this._observationIds = [...observationIds];
    }

    public addEvidence(
        evidence: Evidence,
    ): void {
        this._evidence.push(evidence);
    }

    public get statement(): InterpretationStatement {
        return this._statement;
    }

    public get observationIds(): readonly ObservationId[] {
        return this._observationIds;
    }

    public get evidence(): readonly Evidence[] {
        return this._evidence;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

}