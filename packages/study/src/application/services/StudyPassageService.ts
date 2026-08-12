import { ReadPassage } from "@bsmp/bible";
import type { Passage, Verse } from "@bsmp/bible";

export interface StudyPassageVerse {
    readonly number: number;
    readonly text: string;
    readonly reference: string;
}

export interface StudyPassageData {
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly StudyPassageVerse[];
}

export class StudyPassageService {
    public constructor(
        private readonly readPassage: ReadPassage,
        private readonly passage: Passage,
        private readonly translation: string,
    ) { }

    public get passageReference(): Passage {
        return this.passage;
    }

    public async load(): Promise<StudyPassageData> {
        const verses = await this.readPassage.execute(this.passage);

        return {
            reference: this.passage.toString(),
            translation: this.translation,
            verses: verses.map((verse) => this.toVerseViewModel(verse)),
        };
    }

    private toVerseViewModel(verse: Verse): StudyPassageVerse {
        return {
            number: verse.reference.verse.value,
            text: verse.text.value,
            reference: verse.reference.toString(),
        };
    }
}