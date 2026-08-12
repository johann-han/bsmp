import { Entity } from "@bsmp/shared";

import {
    InterpretationId,
    InterpretationStatement,
    ObservationId,
} from "../value-objects/index.js";

export class Interpretation
    extends Entity<InterpretationId> {

    private readonly _statement: InterpretationStatement;

    private readonly _observationIds: readonly ObservationId[];

    private readonly _createdAt: Date;

    private constructor(
        id: InterpretationId,
        statement: InterpretationStatement,
        observationIds: readonly ObservationId[],
        createdAt: Date,
    ) {

        super(id);

        this._statement = statement;
        this._observationIds = [...observationIds];
        this._createdAt = createdAt;

    }

    public static create(
        id: InterpretationId,
        statement: InterpretationStatement,
        observationIds: readonly ObservationId[] = [],
    ): Interpretation {

        return new Interpretation(
            id,
            statement,
            observationIds,
            new Date(),
        );

    }

    public get statement(): InterpretationStatement {

        return this._statement;

    }

    public get observationIds(): readonly ObservationId[] {

        return this._observationIds;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

}