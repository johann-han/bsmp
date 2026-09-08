import { Entity, ValueObject } from "@bsmp/shared";
import type { ExpositorySermonId } from "./ExpositorySermon.js";

export type SermonOccurrenceStatus = "scheduled" | "completed" | "cancelled";

export class SermonOccurrenceId extends ValueObject<{ value: string }> {
    public static create(value = crypto.randomUUID()): SermonOccurrenceId { return new SermonOccurrenceId({ value }); }
    public get value(): string { return this.get("value"); }
}

export class SermonOccurrence extends Entity<SermonOccurrenceId> {
    private readonly _sermonId: ExpositorySermonId;
    private _scheduledAt: Date;
    private _status: SermonOccurrenceStatus;
    private _venue: string;
    private _serviceName: string;
    private _notes: string;
    private _preachedAt: Date | undefined;
    private readonly _createdAt: Date;

    private constructor(
        id: SermonOccurrenceId,
        sermonId: ExpositorySermonId,
        scheduledAt: Date,
        status: SermonOccurrenceStatus,
        venue: string,
        serviceName: string,
        notes: string,
        preachedAt: Date | undefined,
        createdAt: Date,
    ) {
        super(id);
        this._sermonId = sermonId;
        this._scheduledAt = scheduledAt;
        this._status = status;
        this._venue = venue;
        this._serviceName = serviceName;
        this._notes = notes;
        this._preachedAt = preachedAt;
        this._createdAt = createdAt;
    }

    public static create(
        id: SermonOccurrenceId,
        sermonId: ExpositorySermonId,
        scheduledAt: Date,
        venue = "",
        serviceName = "",
        notes = "",
    ): SermonOccurrence {
        return new SermonOccurrence(id, sermonId, scheduledAt, "scheduled", venue.trim(), serviceName.trim(), notes.trim(), undefined, new Date());
    }

    public reschedule(scheduledAt: Date): void {
        if (this._status === "completed") throw new Error("A completed sermon occurrence cannot be rescheduled.");
        this._scheduledAt = scheduledAt;
        this._status = "scheduled";
    }

    public updateDetails(venue: string, serviceName: string, notes: string): void {
        this._venue = venue.trim();
        this._serviceName = serviceName.trim();
        this._notes = notes.trim();
    }

    public markCompleted(preachedAt = new Date()): void {
        this._status = "completed";
        this._preachedAt = preachedAt;
    }

    public cancel(): void {
        if (this._status === "completed") throw new Error("A completed sermon occurrence cannot be cancelled.");
        this._status = "cancelled";
    }

    public get sermonId(): ExpositorySermonId { return this._sermonId; }
    public get scheduledAt(): Date { return this._scheduledAt; }
    public get status(): SermonOccurrenceStatus { return this._status; }
    public get venue(): string { return this._venue; }
    public get serviceName(): string { return this._serviceName; }
    public get notes(): string { return this._notes; }
    public get preachedAt(): Date | undefined { return this._preachedAt; }
    public get createdAt(): Date { return this._createdAt; }
}
