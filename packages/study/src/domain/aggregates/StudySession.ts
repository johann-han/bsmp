import { AggregateRoot } from "@bsmp/shared";

import {
    StudyId,
    StudyStatus,
    StudyTitle,
} from "../value-objects/index.js";

export class StudySession
    extends AggregateRoot<StudyId> {

    private readonly _title: StudyTitle;

    private readonly _status: StudyStatus;

    private readonly _createdAt: Date;

    private constructor(
        id: StudyId,
        title: StudyTitle,
        status: StudyStatus,
        createdAt: Date,
    ) {

        super(id);

        this._title = title;
        this._status = status;
        this._createdAt = createdAt;

    }

    public static create(
        id: StudyId,
        title: StudyTitle,
    ): StudySession {

        return new StudySession(
            id,
            title,
            StudyStatus.draft(),
            new Date(),
        );

    }

    public get title(): StudyTitle {

        return this._title;

    }

    public get status(): StudyStatus {

        return this._status;

    }

    public get createdAt(): Date {

        return this._createdAt;

    }

}