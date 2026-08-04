import { Entity } from "@bsmp/shared";

import {
    EvidenceDescription,
    EvidenceId,
} from "../value-objects/index.js";

export class Evidence
    extends Entity<EvidenceId> {

    private readonly _description: EvidenceDescription;

    private readonly _createdAt: Date;

    private constructor(
        id: EvidenceId,
        description: EvidenceDescription,
        createdAt: Date,
    ) {

        super(id);

        this._description = description;
        this._createdAt = createdAt;

    }

    public static create(
        id: EvidenceId,
        description: EvidenceDescription,
    ): Evidence {

        return new Evidence(
            id,
            description,
            new Date(),
        );

    }

    public get description(): EvidenceDescription {

        return this._description;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

}