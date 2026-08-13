import { ValidationError, ValueObject } from "@bsmp/shared";

import type { VerseReference } from "@bsmp/bible";

interface ObservationTargetProps {
    verseReference: VerseReference;
    translation: string | null;
    wordIndex: number | null;
    wordText: string | null;
    markupSymbol: string | null;
}

export interface ObservationWordTargetInput {
    readonly translation: string;
    readonly wordIndex: number;
    readonly wordText: string;
    readonly markupSymbol: string;
}

export class ObservationTarget extends ValueObject<ObservationTargetProps> {
    private constructor(props: ObservationTargetProps) {
        super(props);
    }

    public static verse(verseReference: VerseReference): ObservationTarget {
        return new ObservationTarget({
            verseReference,
            translation: null,
            wordIndex: null,
            wordText: null,
            markupSymbol: null,
        });
    }

    public static word(
        verseReference: VerseReference,
        input: ObservationWordTargetInput,
    ): ObservationTarget {
        const translation = input.translation.trim();
        const wordText = input.wordText.trim();
        const markupSymbol = input.markupSymbol.trim();

        if (!translation) throw new ValidationError("Observation target translation cannot be empty.");
        if (!Number.isInteger(input.wordIndex) || input.wordIndex < 0) {
            throw new ValidationError("Observation target word index must be a non-negative integer.");
        }
        if (!wordText) throw new ValidationError("Observation target word text cannot be empty.");
        if (!markupSymbol) throw new ValidationError("Observation target markup symbol cannot be empty.");

        return new ObservationTarget({
            verseReference,
            translation,
            wordIndex: input.wordIndex,
            wordText,
            markupSymbol,
        });
    }

    public get verseReference(): VerseReference {
        return this.get("verseReference");
    }

    public get translation(): string | null {
        return this.get("translation");
    }

    public get wordIndex(): number | null {
        return this.get("wordIndex");
    }

    public get wordText(): string | null {
        return this.get("wordText");
    }

    public get markupSymbol(): string | null {
        return this.get("markupSymbol");
    }

    public get isWordTarget(): boolean {
        return this.wordIndex !== null;
    }

    public override toString(): string {
        if (!this.isWordTarget) return this.verseReference.toString();
        return `${this.verseReference.toString()} · ${this.wordText}`;
    }
}
