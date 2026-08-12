import { Entity } from "@bsmp/shared";

import {
    ApplicationId,
    ApplicationAction,
    ApplicationMinistry,
    ApplicationPersonal,
    ApplicationPrinciple,
    InterpretationId,
} from "../value-objects/index.js";

export class Application extends Entity<ApplicationId> {
    private readonly _interpretationId: InterpretationId;
    private _principle: ApplicationPrinciple;
    private _personal: ApplicationPersonal;
    private _ministry: ApplicationMinistry;
    private _action: ApplicationAction;
    private readonly _createdAt: Date;

    private constructor(
        id: ApplicationId,
        interpretationId: InterpretationId,
        principle: ApplicationPrinciple,
        personal: ApplicationPersonal,
        ministry: ApplicationMinistry,
        action: ApplicationAction,
        createdAt: Date,
    ) {
        super(id);
        this._interpretationId = interpretationId;
        this._principle = principle;
        this._personal = personal;
        this._ministry = ministry;
        this._action = action;
        this._createdAt = createdAt;
    }

    public static create(
        id: ApplicationId,
        interpretationId: InterpretationId,
        principle: ApplicationPrinciple,
        personal: ApplicationPersonal,
        ministry: ApplicationMinistry,
        action: ApplicationAction,
    ): Application {
        return new Application(
            id,
            interpretationId,
            principle,
            personal,
            ministry,
            action,
            new Date(),
        );
    }

    public revise(
        principle: ApplicationPrinciple,
        personal: ApplicationPersonal,
        ministry: ApplicationMinistry,
        action: ApplicationAction,
    ): void {
        this._principle = principle;
        this._personal = personal;
        this._ministry = ministry;
        this._action = action;
    }

    public get interpretationId(): InterpretationId {
        return this._interpretationId;
    }

    public get principle(): ApplicationPrinciple {
        return this._principle;
    }

    public get personal(): ApplicationPersonal {
        return this._personal;
    }

    public get ministry(): ApplicationMinistry {
        return this._ministry;
    }

    public get action(): ApplicationAction {
        return this._action;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }
}
