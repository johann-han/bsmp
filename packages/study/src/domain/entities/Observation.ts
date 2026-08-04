import { Entity } from "@bsmp/shared";

import { Evidence } from "./Evidence.js";

import {
    ObservationId,
    ObservationStatement,
} from "../value-objects/index.js";

export class Observation
    extends Entity<ObservationId> {

    private readonly _statement: ObservationStatement;

    private readonly _createdAt: Date;

    private readonly _evidence: Evidence[];

    private constructor(
        id: ObservationId,
        statement: ObservationStatement,
        createdAt: Date,
        evidence: Evidence[],
    ) {

        super(id);

        this._statement = statement;
        this._createdAt = createdAt;
        this._evidence = evidence;

    }

    public static create(
        id: ObservationId,
        statement: ObservationStatement,
    ): Observation {

        return new Observation(
            id,
            statement,
            new Date(),
            [],
        );

    }

    public addEvidence(
        evidence: Evidence,
    ): void {

        this._evidence.push(
            evidence,
        );

    }

    public get statement(): ObservationStatement {

        return this._statement;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

    public get evidence():
        readonly Evidence[] {

        return this._evidence;

    }

}