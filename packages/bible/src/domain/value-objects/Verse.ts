import { ValueObject } from "@bsmp/shared";

import { VerseReference } from "./VerseReference.js";
import { VerseText } from "./VerseText.js";

interface VerseProps {
    reference: VerseReference;
    text: VerseText;
}

export class Verse extends ValueObject<VerseProps> {

    private constructor(props: VerseProps) {
        super(props);
    }

    public static create(
        reference: VerseReference,
        text: VerseText,
    ): Verse {

        return new Verse({
            reference,
            text,
        });

    }

    public get reference(): VerseReference {
        return this.get("reference");
    }

    public get text(): VerseText {
        return this.get("text");
    }
    

}
