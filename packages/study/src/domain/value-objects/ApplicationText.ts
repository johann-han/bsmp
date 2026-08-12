import { ValidationError, ValueObject } from "@bsmp/shared";

interface ApplicationTextProps {
    value: string;
}

abstract class NonEmptyApplicationText extends ValueObject<ApplicationTextProps> {
    protected static createValue<T extends NonEmptyApplicationText>(
        this: new (props: ApplicationTextProps) => T,
        value: string,
    ): T {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new ValidationError("Application text cannot be empty.");
        }
        return new this({ value: trimmed });
    }

    public get value(): string {
        return this.get("value");
    }
}

export class ApplicationPrinciple extends NonEmptyApplicationText {
    public static from(value: string): ApplicationPrinciple {
        return this.createValue(value);
    }
}

export class ApplicationPersonal extends NonEmptyApplicationText {
    public static from(value: string): ApplicationPersonal {
        return this.createValue(value);
    }
}

export class ApplicationMinistry extends NonEmptyApplicationText {
    public static from(value: string): ApplicationMinistry {
        return this.createValue(value);
    }
}

export class ApplicationAction extends NonEmptyApplicationText {
    public static from(value: string): ApplicationAction {
        return this.createValue(value);
    }
}
