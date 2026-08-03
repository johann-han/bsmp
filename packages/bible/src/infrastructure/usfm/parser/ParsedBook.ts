export interface ParsedVerse {
    number: number;
    text: string;
}

export interface ParsedChapter {
    number: number;
    verses: ParsedVerse[];
}

export interface ParsedBook {
    id: string;
    chapters: ParsedChapter[];
}