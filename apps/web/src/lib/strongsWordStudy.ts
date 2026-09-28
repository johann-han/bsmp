import { parseGreekMorphology, type StrongsMorphology } from "./strongsMorphology";

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
    readonly originalForm: string | null;
    readonly morphology: StrongsMorphology | null;
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

interface RawTagntWord {
    readonly wordIndex: number;
    readonly wordType: string;
    readonly originalForm: string;
    readonly grammar: string | null;
    readonly sStrongInstance: string | null;
    readonly editions: string;
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
const TAGNT_DATA_COMMIT = "b99716b0cddb648ddb95cc786a197180f2f97d48";

const TAGNT_MAT_JHN_URL =
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/" +
    TAGNT_DATA_COMMIT +
    "/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt";
const TAGNT_ACT_REV_URL =
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/" +
    TAGNT_DATA_COMMIT +
    "/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt";

const KJV_BOOK_FILES: Record<string, string> = {
    GEN: "Gen", EXO: "Exod", LEV: "Lev", NUM: "Num", DEU: "Deut",
    JOS: "Josh", JDG: "Judg", RUT: "Ruth", "1SA": "1Sam", "2SA": "2Sam",
    "1KI": "1Kgs", "2KI": "2Kgs", "1CH": "1Chr", "2CH": "2Chr", EZR: "Ezra",
    NEH: "Neh", EST: "Esth", JOB: "Job", PSA: "Ps", PRO: "Prov", ECC: "Eccl",
    SNG: "Song", ISA: "Isa", JER: "Jer", LAM: "Lam", EZK: "Ezek", DAN: "Dan",
    HOS: "Hos", JOL: "Joel", AMO: "Amos", OBA: "Obad", JON: "Jonah", MIC: "Mic",
    NAM: "Nah", HAB: "Hab", ZEP: "Zeph", HAG: "Hag", ZEC: "Zech", MAL: "Mal",
    MAT: "Matt", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Rom",
    "1CO": "1Cor", "2CO": "2Cor", GAL: "Gal", EPH: "Eph", PHP: "Phil", COL: "Col",
    "1TH": "1Thess", "2TH": "2Thess", "1TI": "1Tim", "2TI": "2Tim", TIT: "Titus",
    PHM: "Phlm", HEB: "Heb", JAS: "Jas", "1PE": "1Pet", "2PE": "2Pet",
    "1JN": "1John", "2JN": "2John", "3JN": "3John", JUD: "Jude", REV: "Rev",
};

const GREEK_DICTIONARY_URL =
    "https://raw.githubusercontent.com/openscriptures/strongs/" +
    STRONGS_DATA_COMMIT +
    "/greek/strongs-greek-dictionary.js";
const HEBREW_DICTIONARY_URL =
    "https://raw.githubusercontent.com/openscriptures/strongs/" +
    STRONGS_DATA_COMMIT +
    "/hebrew/strongs-hebrew-dictionary.js";

const dictionaryCache = new Map<StrongsLanguage, Promise<RawDictionary>>();
const tagntCache = new Map<"mat-jhn" | "act-rev", Promise<string>>();

function dictionaryUrl(language: StrongsLanguage): string {
    return language === "G" ? GREEK_DICTIONARY_URL : HEBREW_DICTIONARY_URL;
}

function tagntUrl(bookId: string): string | null {
    const upper = bookId.toUpperCase();
    if (["MAT", "MRK", "LUK", "JHN"].includes(upper)) return TAGNT_MAT_JHN_URL;
    if ([
        "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH",
        "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN",
        "3JN", "JUD", "REV",
    ].includes(upper)) return TAGNT_ACT_REV_URL;
    return null;
}

async function loadTagntSource(bookId: string): Promise<string | null> {
    const url = tagntUrl(bookId);
    if (!url) return null;
    const key = url === TAGNT_MAT_JHN_URL ? "mat-jhn" : "act-rev";
    const cached = tagntCache.get(key);
    if (cached) return cached;

    const promise = fetch(url, { next: { revalidate: 86400 } })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(
                    "Unable to load STEPBible Greek morphology data (HTTP " +
                        response.status +
                        ").",
                );
            }
            return response.text();
        })
        .catch((error) => {
            tagntCache.delete(key);
            throw error;
        });

    tagntCache.set(key, promise);
    return promise;
}

function baseStrongsNumber(value: string): string | null {
    const match = value.trim().match(/^([GH]\d+)/i);
    return match?.[1]?.toUpperCase() ?? null;
}

function splitStrongsInstance(value: string): { number: string; instance: string | null } | null {
    const match = value.trim().match(/^([GH]\d+)(?:_([A-Za-z]))?$/i);
    if (!match) return null;
    return {
        number: match[1]!.toUpperCase(),
        instance: match[2]?.toUpperCase() ?? null,
    };
}

function instanceSuffix(index: number): string {
    let value = index;
    let suffix = "";
    while (value > 0) {
        value -= 1;
        suffix = String.fromCharCode(65 + (value % 26)) + suffix;
        value = Math.floor(value / 26);
    }
    return suffix;
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
    const assignmentMatch = source.match(/var\s+strongs(?:Greek|Hebrew)Dictionary\s*=\s/);
    const exportMarker = source.lastIndexOf("; module.exports");
    if (!assignmentMatch || assignmentMatch.index === undefined || exportMarker < 0) {
        throw new Error("Strong's dictionary source has an unsupported format.");
    }

    const json = source
        .slice(assignmentMatch.index + assignmentMatch[0].length, exportMarker)
        .trim();
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
        originalForm: lexicalContext.originalForm,
        morphology: lexicalContext.morphology,
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

function parseTagntVerse(source: string, reference: string): RawTagntWord[] {
    const prefix = reference.trim().replace(/\s+/g, ".") + "#";

    return source
        .split(/\r?\n/)
        .filter((line) => line.startsWith(prefix))
        .map((line) => {
            const fields = line.split("\t");
            const location = fields[0] ?? "";
            const match = location.match(/^.+#(\d+)=([A-Za-z]+)$/);
            if (!match) return null;

            const strongGrammar = fields[3] ?? "";
            const separator = strongGrammar.indexOf("=");
            const wordIndex = Number(match[1]);

            if (!Number.isInteger(wordIndex) || separator < 0 || !fields[1]) return null;

            return {
                wordIndex,
                wordType: match[2] ?? "",
                originalForm: (fields[1] ?? "").split(" (")[0]!.trim(),
                grammar: strongGrammar.slice(separator + 1).trim() || null,
                sStrongInstance: fields[10]?.trim() || null,
                editions: fields[5]?.trim() ?? "",
            };
        })
        .filter((item): item is RawTagntWord => item !== null)
        .sort((a, b) => a.wordIndex - b.wordIndex);
}

function traditionalTagntRow(word: RawTagntWord): boolean {
    return /(?:^|\+)(?:TR|Byz)(?:$|\+)/.test(word.editions) || word.wordType.includes("K");
}

function selectedStrongOccurrence(
    words: readonly TaggedWord[],
    selectedIndex: number,
    strongsNumber: string,
): number {
    const target = baseStrongsNumber(strongsNumber);
    if (!target) return -1;

    return words
        .slice(0, selectedIndex + 1)
        .filter((word) => word.strongs.some((value) => baseStrongsNumber(value) === target))
        .length;
}

function findTagntWord(
    words: readonly RawTagntWord[],
    strongsNumber: string,
    occurrence: number,
): RawTagntWord | null {
    const target = baseStrongsNumber(strongsNumber);
    if (!target || occurrence < 1) return null;

    const expectedInstance = occurrence === 1 ? null : instanceSuffix(occurrence);
    const candidates = words.filter((word) => {
        const parsed = word.sStrongInstance ? splitStrongsInstance(word.sStrongInstance) : null;
        if (!parsed || parsed.number !== target) return false;
        return expectedInstance === null
            ? parsed.instance === null
            : parsed.instance === expectedInstance;
    });

    const traditional = candidates.find(traditionalTagntRow);
    return traditional ?? candidates[0] ?? null;
}

async function fetchTaggedVerse(bookId: string, chapter: number, verse: number): Promise<string> {
    const sourceBookId = KJV_BOOK_FILES[bookId.toUpperCase()];
    if (!sourceBookId) {
        throw new Error("KJV word data does not support the requested book.");
    }

    const response = await fetch(
        "https://raw.githubusercontent.com/kaiserlik/kjv/" +
            KJV_DATA_COMMIT +
            "/" +
            encodeURIComponent(sourceBookId) +
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

    const verseKey = sourceBookId + "|" + chapter + "|" + verse;
    const tagged = payload[sourceBookId]?.[sourceBookId + "|" + chapter]?.[verseKey]?.en;

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
    const tagntSource =
        selected.strongs.some((number) => number.startsWith("G"))
            ? await loadTagntSource(bookId)
            : null;

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

            let lexicalContext: {
                readonly originalForm: string | null;
                readonly morphology: StrongsMorphology | null;
            } = { originalForm: null, morphology: null };

            if (language === "G" && tagntSource) {
                const occurrence = selectedStrongOccurrence(taggedWords, selected.index, number);
                const referenceParts = KJV_BOOK_FILES[bookId.toUpperCase()];
                if (referenceParts && occurrence > 0) {
                    const tagntWords = parseTagntVerse(
                        tagntSource,
                        referenceParts + "." + chapter + "." + verse,
                    );
                    const tagntWord = findTagntWord(tagntWords, number, occurrence);

                    if (tagntWord?.grammar) {
                        lexicalContext = {
                            originalForm: tagntWord.originalForm,
                            morphology: parseGreekMorphology(tagntWord.grammar),
                        };
                    }
                }
            }

            return toLexiconEntry(number, dictionary[number], lexicalContext);
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
    parseGreekMorphology,
    parseTagntVerse,
    findTagntWord,
    selectedStrongOccurrence,
};
