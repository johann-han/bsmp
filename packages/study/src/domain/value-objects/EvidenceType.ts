import { ValueObject } from "@bsmp/shared";

interface EvidenceTypeProps {

    value: string;

}

export class EvidenceType
    extends ValueObject<EvidenceTypeProps> {

    public static scripture(): EvidenceType {

        return new EvidenceType({
            value: "Scripture",
        });

    }

    public static crossReference(): EvidenceType {

        return new EvidenceType({
            value: "CrossReference",
        });

    }

    public static originalLanguage(): EvidenceType {

        return new EvidenceType({
            value: "OriginalLanguage",
        });

    }

    public static historical(): EvidenceType {

        return new EvidenceType({
            value: "Historical",
        });

    }

    public static geographical(): EvidenceType {

        return new EvidenceType({
            value: "Geographical",
        });

    }

    public static literary(): EvidenceType {

        return new EvidenceType({
            value: "Literary",
        });

    }

    public static personalNote(): EvidenceType {

        return new EvidenceType({
            value: "PersonalNote",
        });

    }

    public static other(): EvidenceType {

        return new EvidenceType({
            value: "Other",
        });

    }

    public get value(): string {

        return this.get("value");

    }

}