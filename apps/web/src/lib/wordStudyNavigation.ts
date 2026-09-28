export interface WordStudyNavigationTarget {
    readonly verseNumber: number;
    readonly wordIndex: number;
}

export function getAdjacentWordStudyTarget(
    verses: readonly { readonly number: number; readonly text: string }[],
    current: WordStudyNavigationTarget,
    direction: -1 | 1,
): WordStudyNavigationTarget | null {
    const verseIndex = verses.findIndex((verse) => verse.number === current.verseNumber);
    if (verseIndex < 0) return null;

    const currentWords = verses[verseIndex]?.text.match(/\S+/g) ?? [];
    if (current.wordIndex < 0 || current.wordIndex >= currentWords.length) return null;

    const nextIndex = current.wordIndex + direction;
    if (nextIndex >= 0 && nextIndex < currentWords.length) {
        return { verseNumber: current.verseNumber, wordIndex: nextIndex };
    }

    const nextVerseIndex = verseIndex + direction;
    const nextVerse = verses[nextVerseIndex];
    if (!nextVerse) return null;

    const nextWords = nextVerse.text.match(/\S+/g) ?? [];
    if (nextWords.length === 0) return null;

    return {
        verseNumber: nextVerse.number,
        wordIndex: direction === 1 ? 0 : nextWords.length - 1,
    };
}
