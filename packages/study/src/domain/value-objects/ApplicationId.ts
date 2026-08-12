import { Identifier } from "@bsmp/shared";

export class ApplicationId extends Identifier<string> {
    public static create(): ApplicationId {
        return new ApplicationId(crypto.randomUUID());
    }

    public static from(value: string): ApplicationId {
        return new ApplicationId(value);
    }
}
