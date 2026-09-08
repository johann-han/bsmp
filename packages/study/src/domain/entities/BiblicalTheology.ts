import { Entity } from "@bsmp/shared";

import {
    BiblicalTheologyId,
    InterpretationId,
} from "../value-objects/index.js";

export class BiblicalTheology extends Entity<BiblicalTheologyId> {
    private _theme: string;
    private _synthesis: string;
    private _interpretationIds: InterpretationId[];
    private readonly _createdAt: Date;

    private constructor(
        id: BiblicalTheologyId,
        theme: string,
        synthesis: string,
        interpretationIds: readonly InterpretationId[],
        createdAt: Date,
    ) {
        super(id);
        this._theme = theme.trim();
        this._synthesis = synthesis.trim();
        this._interpretationIds = [...interpretationIds];
        this._createdAt = createdAt;
    }

    public static create(
        id: BiblicalTheologyId,
        theme: string,
        synthesis: string,
        interpretationIds: readonly InterpretationId[],
    ): BiblicalTheology {
        if (!theme.trim()) throw new Error("Biblical theology theme cannot be empty.");
        if (!synthesis.trim()) throw new Error("Biblical theology synthesis cannot be empty.");
        if (interpretationIds.length === 0) throw new Error("Select at least one supporting interpretation before saving biblical theology.");
        return new BiblicalTheology(id, theme, synthesis, interpretationIds, new Date());
    }

    public revise(
        theme: string,
        synthesis: string,
        interpretationIds: readonly InterpretationId[],
    ): void {
        if (!theme.trim()) throw new Error("Biblical theology theme cannot be empty.");
        if (!synthesis.trim()) throw new Error("Biblical theology synthesis cannot be empty.");
        if (interpretationIds.length === 0) throw new Error("Select at least one supporting interpretation before saving biblical theology.");
        this._theme = theme.trim();
        this._synthesis = synthesis.trim();
        this._interpretationIds = [...interpretationIds];
    }

    public get theme(): string { return this._theme; }
    public get synthesis(): string { return this._synthesis; }
    public get interpretationIds(): readonly InterpretationId[] { return this._interpretationIds; }
    public get createdAt(): Date { return this._createdAt; }
}
