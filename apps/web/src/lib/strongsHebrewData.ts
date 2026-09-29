import { parseHebrewMorphology } from "./strongsHebrewMorphology";
import type { StrongsMorphology } from "./strongsMorphology";

const TAHOT_COMMIT = "b99716b0cddb648ddb95cc786a197180f2f97d48";

const TAHOT_FILES = {
    "Gen-Deu": "TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "Jos-Est": "TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "Job-Sng": "TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "Isa-Mal": "TAHOT%20Isa-Mal%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
} as const;

type TahotFile = keyof typeof TAHOT_FILES;

const TAHOT_BOOK_FILE: Record<string, TahotFile> = {
    GEN: "Gen-Deu",
    EXO: "Gen-Deu",
    LEV: "Gen-Deu",
    NUM: "Gen-Deu",
    DEU: "Gen-Deu",
    JOS: "Jos-Est",
    JDG: "Jos-Est",
    RUT: "Jos-Est",
    "1SA": "Jos-Est",
    "2SA": "Jos-Est",
    "1KI": "Jos-Est",
    "2KI": "Jos-Est",
    "1CH": "Jos-Est",
    "2CH": "Jos-Est",
    EZR: "Jos-Est",
    NEH: "Jos-Est",
    EST: "Jos-Est",
    JOB: "Job-Sng",
    PSA: "Job-Sng",
    PRO: "Job-Sng",
    ECC: "Job-Sng",
    SNG: "Job-Sng",
    ISA: "Isa-Mal",
    JER: "Isa-Mal",
    LAM: "Isa-Mal",
    EZK: "Isa-Mal",
    DAN: "Isa-Mal",
    HOS: "Isa-Mal",
    JOL: "Isa-Mal",
    AMO: "Isa-Mal",
    OBA: "Isa-Mal",
    JON: "Isa-Mal",
    MIC: "Isa-Mal",
    NAM: "Isa-Mal",
    HAB: "Isa-Mal",
    ZEP: "Isa-Mal",
    HAG: "Isa-Mal",
    ZEC: "Isa-Mal",
    MAL: "Isa-Mal",
};

interface TahotWord {
    readonly location: string;
    readonly wordIndex: number;
    readonly type: string;
    readonly hebrew: string;
    readonly dStrongs: string;
    readonly grammar: string;
    readonly rootDStrongInstance: string;
}

export interface HebrewWordStudyData {
    readonly originalForm: string;
    readonly morphology: StrongsMorphology;
}

const cache = new Map<TahotFile, { expiresAt: number; promise: Promise<string> }>();
const CACHE_MS = 24 * 60 * 60 * 1000;

function sourceUrl(file: TahotFile): string {
    return (
        "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/" +
        TAHOT_COMMIT +
        "/Translators%20Amalgamated%20OT%2BNT/" +
        TAHOT_FILES[file]
    );
}

async function loadTahot(file: TahotFile): Promise<string> {
    const now = Date.now();
    const cached = cache.get(file);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const promise = fetch(sourceUrl(file)).then(async (response) => {
        if (!response.ok) {
            throw new Error(
                "Unable to load STEPBible TAHOT data (" + response.status + ").",
            );
        }
        return response.text();
    });

    cache.set(file, {
        expiresAt: now + CACHE_MS,
        promise,
    });

    try {
        return await promise;
    } catch (error) {
        cache.delete(file);
        throw error;
    }
}

const REF_RE =
    /^([A-Za-z0-9]+)\.(\d+)\.(\d+)(?:\(\d+\.\d+\))?#(\d+)=(\S+)$/;

function parseTahotVerse(source: string, reference: string): TahotWord[] {
    const [book, chapter, verse] = reference.split(".");
    if (!book || !chapter || !verse) return [];

    const prefix = book + "." + chapter + "." + verse + "#";
    const words: TahotWord[] = [];

    for (const line of source.split(/\r?\n/)) {
        if (!line.startsWith(prefix)) continue;

        const fields = line.split("\t");
        if (fields.length < 12) continue;

        const match = REF_RE.exec(fields[0] ?? "");
        if (!match) continue;

        const wordIndex = Number.parseInt(match[4]!, 10);
        if (!Number.isFinite(wordIndex)) continue;

        words.push({
            location: fields[0]!,
            wordIndex,
            type: match[5]!,
            hebrew: fields[1]!,
            dStrongs: fields[4]!,
            grammar: fields[5]!,
            rootDStrongInstance: fields[8]!,
        });
    }

    return words.sort((a, b) => a.wordIndex - b.wordIndex);
}

function baseStrong(value: string): string {
    const match = /^([GH]\d+)/i.exec(value.trim());
    return match ? match[1]!.toUpperCase() : value.trim().toUpperCase();
}

function extractStrongTags(value: string): string[] {
    return (value.match(/[GH]\d+(?:[A-Za-z]{0,2})?/gi) ?? []).map((tag) =>
        tag.toUpperCase(),
    );
}

function languagePrefix(grammar: string): "H" | "A" | null {
    const first = grammar.trim().charAt(0);
    return first === "H" || first === "A" ? first : null;
}

function normalizeGrammarPart(
    grammar: string,
    index: number,
    firstLanguage: "H" | "A" | null,
): string {
    const value = grammar.trim();
    if (index === 0 || !firstLanguage || value.startsWith("H") || value.startsWith("A")) {
        return value;
    }
    return firstLanguage + value;
}

function cleanHebrewPart(value: string): string {
    return value.split("\\")[0]?.trim() ?? value.trim();
}

function isRootSegment(value: string, target: string): boolean {
    return extractStrongTags(value).some((tag) => {
        return tag === target && value.includes("{");
    });
}

function findTahotSegment(
    words: readonly TahotWord[],
    targetStrong: string,
    occurrence: number,
): { readonly originalForm: string; readonly morphology: StrongsMorphology } | null {
    const target = baseStrong(targetStrong);
    let seen = 0;

    for (const word of words) {
        const hebrewParts = word.hebrew.split("/");
        const dStrongParts = word.dStrongs.split("/");
        const grammarParts = word.grammar.split("/");

        if (
            hebrewParts.length !== dStrongParts.length ||
            hebrewParts.length !== grammarParts.length
        ) {
            continue;
        }

        const firstLanguage = languagePrefix(grammarParts[0] ?? "");

        for (let index = 0; index < dStrongParts.length; index++) {
            const tags = extractStrongTags(dStrongParts[index] ?? "");
            if (!tags.some((tag) => baseStrong(tag) === target)) continue;

            seen += 1;
            if (seen !== occurrence) continue;

            const grammar = normalizeGrammarPart(
                grammarParts[index] ?? "",
                index,
                firstLanguage,
            );
            if (!grammar) return null;

            return {
                originalForm: cleanHebrewPart(hebrewParts[index] ?? ""),
                morphology: parseHebrewMorphology(grammar),
            };
        }
    }

    return null;
}

export function __test__() {
    return {
        parseTahotVerse,
        findTahotSegment,
        baseStrong,
    };
}

export async function lookupHebrewWordStudy(
    reference: string,
    strongNumber: string,
    occurrence: number,
): Promise<HebrewWordStudyData | null> {
    const [book] = reference.split(".");
    const file = TAHOT_BOOK_FILE[book ?? ""];
    if (!file) return null;

    const source = await loadTahot(file);
    const words = parseTahotVerse(source, reference);
    if (words.length === 0) return null;

    return findTahotSegment(words, strongNumber, occurrence);
}
