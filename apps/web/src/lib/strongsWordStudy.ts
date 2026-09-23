export type StrongsLanguage = "G" | "H";

export interface StrongsLexiconEntry {
    readonly number: string;
    readonly language: StrongsLanguage;
    readonly lemma: string;
    readonly transliteration: string | null;
    readonly pronunciation: string | null;
    readonly derivation: string | null;
    readonly strongsDefinition: string | null;
    readonly kjvDefinition: string | null;
}

export interface StrongsWordStudy {
    readonly reference: string;
    readonly translation: "kjv";
    readonly word: string;
    readonly wordIndex: number;
    readonly strongs: readonly StrongsLexiconEntry[];
}

interface TaggedWord {
    readonly word: string;
    readonly strongs: readonly string[];
}

interface RawLexiconEntry {
    readonly lemma?: unknown;
    readonly translit?: unknown;
    readonly pron?: unknown;
    readonly derivation?: unknown;
    readonly strongs_def?: unknown;
    readonly kjv_def?: unknown;
}

type RawDictionary = Record<string, RawLexiconEntry>;

const KJV_DATA_COMMIT = "323f79bc6f4c2749e77a23a71b7ca7772fad81a7";
const STRONGS_DATA_COMMIT = "0acd2f251c2d35ff8db2dece4e0593979d3ac223";

const GREEK_DICTIONARY_URL =
    "https://raw.githubusercontent.com/openscriptures/strongs/" +
    STRONGS_DATA_COMMIT +
    "/greek/strongs-greek-dictionary.js";
const HEBREW_DICTIONARY_URL =
    "https://raw.githubusercontent.com/openscriptures/strongs/" +
    STRONGS_DATA_COMMIT +
    "/hebrew/strongs-hebrew-dictionary.js";

const dictionaryCache = new Map<StrongsLanguage, Promise<RawDictionary>>();

function dictionaryUrl(language: StrongsLanguage): string {
    return language === "G" ? GREEK_DICTIONARY_URL : HEBREW_DICTIONARY_URL;
}

function cleanTaggedWord(value: string): string {
    return value
        .replace(/<[^>]+>/g, "")
        .replace(/\[[GH]\d+\]/g, "")
        .trim();
}

function normalizeWord(value: string): string {
    return cleanTaggedWord(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function parseTaggedVerse(value: string): TaggedWord[] {
    return value
        .replace(/<[^>]+>/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => ({
            word: cleanTaggedWord(token),
            strongs: Array.from(token.matchAll(/\[([GH]\d+)\]/g), (match) => match[1] as string),
        }))
        .filter((token) => token.word.length > 0);
}

export function parseStrongsDictionary(source: string): RawDictionary {
    const assignmentIndex = source.indexOf("=");
    const exportMarker = source.lastIndexOf("; module.exports");
    if (assignmentIndex < 0 || exportMarker < 0 || exportMarker <= assignmentIndex) {
        throw new Error("Strong's dictionary source has an unsupported format.");
    }

    const json = source.slice(assignmentIndex + 1, exportMarker).trim();
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Strong's dictionary source did not contain an object.");
    }

    return parsed as RawDictionary;
}

async function loadDictionary(language: StrongsLanguage): Promise<RawDictionary> {
    const cached = dictionaryCache.get(language);
    if (cached) return cached;

    const promise = fetch(dictionaryUrl(language), {
        next: { revalidate: 86400 },
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(
                    "Unable to load the " +
                        (language === "G" ? "Greek" : "Hebrew") +
                        " Strong's dictionary (HTTP " +
                        response.status +
                        ").",
                );
            }
            return parseStrongsDictionary(await response.text());
        })
        .catch((error) => {
            dictionaryCache.delete(language);
            throw error;
        });

    dictionaryCache.set(language, promise);
    return promise;
}

function toLexiconEntry(number: string, raw: RawLexiconEntry | undefined): StrongsLexiconEntry {
    const language = number[0] as StrongsLanguage;
    if (!raw || typeof raw !== "object") {
        throw new Error("Strong's entry " + number + " was not found.");
    }

    return {
        number,
        language,
        lemma: typeof raw.lemma === "string" ? raw.lemma : "",
        transliteration: typeof raw.translit === "string" ? raw.translit : null,
        pronunciation: typeof raw.pron === "string" ? raw.pron : null,
        derivation: typeof raw.derivation === "string" ? raw.derivation : null,
        strongsDefinition: typeof raw.strongs_def === "string" ? raw.strongs_def : null,
        kjvDefinition: typeof raw.kjv_def === "string" ? raw.kjv_def : null,
    };
}

function splitReference(reference: string): { bookId: string; chapter: number; verse: number } {
    const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) throw new Error("The Bible verse reference must look like Book 1:1.");

    const bookId = match[1]?.trim() ?? "";
    const chapter = Number(match[2]);
    const verse = Number(match[3]);

    if (
        !/^[1-3]?[A-Za-z]{2,6}$/.test(bookId) ||
        !Number.isInteger(chapter) ||
        !Number.isInteger(verse) ||
        chapter < 1 ||
        verse < 1
    ) {
        throw new Error("The Bible verse reference is invalid.");
    }

    return { bookId, chapter, verse };
}

function selectTaggedWord(
    words: readonly TaggedWord[],
    requestedWord: string,
    requestedIndex: number,
): TaggedWord & { index: number } {
    const exact = words[requestedIndex];
    if (exact && normalizeWord(exact.word) === normalizeWord(requestedWord)) {
        return { ...exact, index: requestedIndex };
    }

    const normalizedRequested = normalizeWord(requestedWord);
    const matches = words
        .map((item, index) => ({ ...item, index }))
        .filter((item) => normalizeWord(item.word) === normalizedRequested);

    if (matches.length === 0) {
        throw new Error("The selected word could not be matched to the KJV word data.");
    }

    return matches.sort(
        (a, b) => Math.abs(a.index - requestedIndex) - Math.abs(b.index - requestedIndex),
    )[0]!;
}

async function fetchTaggedVerse(bookId: string, chapter: number, verse: number): Promise<string> {
    const response = await fetch(
        "https://raw.githubusercontent.com/kaiserlik/kjv/" +
            KJV_DATA_COMMIT +
            "/" +
            encodeURIComponent(bookId) +
            ".json",
        { next: { revalidate: 86400 } },
    );
    if (!response.ok) {
        throw new Error("Unable to load KJV word data (HTTP " + response.status + ").");
    }

    const payload = (await response.json()) as Record<
        string,
        Record<string, Record<string, { en?: unknown }>>
    >;

    const verseKey = bookId + "|" + chapter + "|" + verse;
    const tagged = payload[bookId]?.[bookId + "|" + chapter]?.[verseKey]?.en;

    if (typeof tagged !== "string" || !tagged.trim()) {
        throw new Error("KJV word data does not contain the requested verse.");
    }

    return tagged;
}

export async function lookupStrongsWordStudy(input: {
    readonly reference: string;
    readonly word: string;
    readonly wordIndex: number;
}): Promise<StrongsWordStudy> {
    const reference = input.reference.trim();
    const word = input.word.trim();
    const wordIndex = Number.isInteger(input.wordIndex) ? input.wordIndex : -1;

    if (!reference || !word || wordIndex < 0) {
        throw new Error("A verse reference, word, and non-negative word index are required.");
    }

    const { bookId, chapter, verse } = splitReference(reference);
    const taggedVerse = await fetchTaggedVerse(bookId, chapter, verse);
    const taggedWords = parseTaggedVerse(taggedVerse);
    const selected = selectTaggedWord(taggedWords, word, wordIndex);

    if (selected.strongs.length === 0) {
        return {
            reference,
            translation: "kjv",
            word: selected.word,
            wordIndex: selected.index,
            strongs: [],
        };
    }

    const entries = await Promise.all(
        selected.strongs.map(async (number) => {
            const language = number[0] as StrongsLanguage;
            const dictionary = await loadDictionary(language);
            return toLexiconEntry(number, dictionary[number]);
        }),
    );

    return {
        reference,
        translation: "kjv",
        word: selected.word,
        wordIndex: selected.index,
        strongs: entries,
    };
}

export const __test__ = {
    cleanTaggedWord,
    normalizeWord,
    splitReference,
    selectTaggedWord,
};
