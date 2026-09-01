import { Entity } from "@bsmp/shared";

import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
} from "../value-objects/index.js";

export class Evidence
    extends Entity<EvidenceId> {

    private _type: EvidenceType;

    private _description: EvidenceDescription;

    private readonly _createdAt: Date;

    private constructor(
        id: EvidenceId,
        type: EvidenceType,
        description: EvidenceDescription,
        createdAt: Date,
    ) {

        super(id);

        this._type = type;
        this._description = description;
        this._createdAt = createdAt;

    }

    public static create(
        id: EvidenceId,
        type: EvidenceType,
        description: EvidenceDescription,
    ): Evidence {

        return new Evidence(
            id,
            type,
            description,
            new Date(),
        );

    }

    public revise(
        type: EvidenceType,
        description: EvidenceDescription,
    ): void {
        this._type = type;
        this._description = description;
    }

    public get type(): EvidenceType {

        return this._type;

    }

    public get description(): EvidenceDescription {

        return this._description;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

}
