import { ValueObject } from "@bsmp/shared";

import { VerseReference } from "./VerseReference.js";

interface PassageProps {
    start: VerseReference;
    end: VerseReference;
}

export class Passage extends ValueObject<PassageProps> {

    private constructor(
        props: PassageProps,
    ) {
        super(props);
    }

    public static create(
        start: VerseReference,
        end: VerseReference,
    ): Passage {

        if (start.compareTo(end) > 0) {
            throw new Error(
                "The end of a passage cannot precede its start.",
            );
        }

        return new Passage({
            start,
            end,
        });

    }

    public get start(): VerseReference {
        return this.get("start");
    }

    public get end(): VerseReference {
        return this.get("end");
    }

}