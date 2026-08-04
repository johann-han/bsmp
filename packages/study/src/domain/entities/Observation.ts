import { Entity } from "@bsmp/shared";

import {
    ObservationId,
    ObservationStatement,
} from "../value-objects/index.js";

export class Observation
    extends Entity<ObservationId> {

    private readonly _statement: ObservationStatement;

    private readonly _createdAt: Date;

    private constructor(
        id: ObservationId,
        statement: ObservationStatement,
        createdAt: Date,
    ) {

        super(id);

        this._statement = statement;
        this._createdAt = createdAt;

    }

    public static create(
        id: ObservationId,
        statement: ObservationStatement,
    ): Observation {

        return new Observation(
            id,
            statement,
            new Date(),
        );

    }

    public get statement(): ObservationStatement {

        return this._statement;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

}