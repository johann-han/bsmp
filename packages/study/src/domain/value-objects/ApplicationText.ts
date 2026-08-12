import { ValidationError, ValueObject } from "@bsmp/shared";

interface ApplicationTextProps {
    value: string;
}

abstract class NonEmptyApplicationText extends ValueObject<ApplicationTextProps> {
    protected constructor(props: ApplicationTextProps) {
        super(props);
    }

    protected static validate(value: string): string {
        const trimmed = value.trim();

        if (!trimmed) {
            throw new ValidationError("Application text cannot be empty.");
        }

        return trimmed;
    }

    public get value(): string {
        return this.get("value");
    }
}

export class ApplicationPrinciple extends NonEmptyApplicationText {
    public static from(value: string): ApplicationPrinciple {
        return new ApplicationPrinciple({
            value: ApplicationPrinciple.validate(value),
        });
    }
}

export class ApplicationPersonal extends NonEmptyApplicationText {
    public static from(value: string): ApplicationPersonal {
        return new ApplicationPersonal({
            value: ApplicationPersonal.validate(value),
        });
    }
}

export class ApplicationMinistry extends NonEmptyApplicationText {
    public static from(value: string): ApplicationMinistry {
        return new ApplicationMinistry({
            value: ApplicationMinistry.validate(value),
        });
    }
}

export class ApplicationAction extends NonEmptyApplicationText {
    public static from(value: string): ApplicationAction {
        return new ApplicationAction({
            value: ApplicationAction.validate(value),
        });
    }
}
