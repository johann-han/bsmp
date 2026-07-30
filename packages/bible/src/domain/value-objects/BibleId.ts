import { Identifier } from "@bsmp/shared";

export class BibleId extends Identifier<string> {

    public static from(value: string): BibleId {
        return new BibleId(value);
    }

}