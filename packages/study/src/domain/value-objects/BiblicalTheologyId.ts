import { Identifier } from "@bsmp/shared";

export class BiblicalTheologyId extends Identifier<string> {
    public static create(): BiblicalTheologyId {
        return new BiblicalTheologyId(crypto.randomUUID());
    }

    public static from(value: string): BiblicalTheologyId {
        return new BiblicalTheologyId(value);
    }
}
