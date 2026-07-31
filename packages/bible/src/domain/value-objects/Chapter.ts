import { ValueObject } from "@bsmp/shared";
import { ChapterNumber } from "./ChapterNumber.js";
import { Verse } from "./Verse.js";
import { VerseNumber } from "./VerseNumber.js";

interface ChapterProps {
    number: ChapterNumber;
    verses: readonly Verse[];
}

export class Chapter extends ValueObject<ChapterProps> {

    private constructor(
        props: ChapterProps,
    ) {
        super(props);
    }

    public static create(
        number: ChapterNumber,
        verses: readonly Verse[],
    ): Chapter {

        return new Chapter({
            number,
            verses,
        });

    }

    public get number(): ChapterNumber {
        return this.get("number");
    }

    public get verses(): readonly Verse[] {
        return this.get("verses");
    }

    public verse(
        number: VerseNumber,
    ): Verse | undefined {

        return this.get("verses").find(
            verse => verse.reference.verse.equals(number),
        );

    }

}