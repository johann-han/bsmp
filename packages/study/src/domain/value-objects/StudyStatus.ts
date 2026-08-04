import { ValueObject } from "@bsmp/shared";

interface StudyStatusProps {

    value: string;

}

export class StudyStatus
    extends ValueObject<StudyStatusProps> {

    public static draft(): StudyStatus {

        return new StudyStatus({
            value: "Draft",
        });

    }

    public static inProgress(): StudyStatus {

        return new StudyStatus({
            value: "InProgress",
        });

    }

    public static completed(): StudyStatus {

        return new StudyStatus({
            value: "Completed",
        });

    }

    public static archived(): StudyStatus {

        return new StudyStatus({
            value: "Archived",
        });

    }

    public get value(): string {

        return this.get("value");

    }

}