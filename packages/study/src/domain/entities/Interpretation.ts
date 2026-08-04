import { Entity } from "@bsmp/shared";

import {
    InterpretationId,
    InterpretationStatement,
} from "../value-objects/index.js";

export class Interpretation
    extends Entity<InterpretationId> {

    private readonly _statement: InterpretationStatement;

    private readonly _createdAt: Date;

    private constructor(
        id: InterpretationId,
        statement: InterpretationStatement,
        createdAt: Date,
    ) {

        super(id);

        this._statement = statement;
        this._createdAt = createdAt;

    }

    public static create(
        id: InterpretationId,
        statement: InterpretationStatement,
    ): Interpretation {

        return new Interpretation(
            id,
            statement,
            new Date(),
        );

    }

    public get statement(): InterpretationStatement {

        return this._statement;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

}