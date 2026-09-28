export interface StrongsMorphology {
    readonly language: "G";
    readonly code: string;
    readonly partOfSpeech: string | null;
    readonly tense: string | null;
    readonly voice: string | null;
    readonly mood: string | null;
    readonly form: string | null;
    readonly person: string | null;
    readonly grammaticalCase: string | null;
    readonly number: string | null;
    readonly gender: string | null;
    readonly degree: string | null;
    readonly qualifier: string | null;
    readonly summary: string;
}

const PART_OF_SPEECH: Record<string, string> = {
    A: "Adjective",
    C: "Conjunction",
    D: "Adverb",
    I: "Interjection",
    N: "Noun",
    P: "Personal pronoun",
    Q: "Correlative / interrogative",
    R: "Relative pronoun",
    S: "Possessive pronoun",
    T: "Article",
    V: "Verb",
    X: "Indefinite pronoun",
};

const TENSE: Record<string, string> = {
    A: "Aorist",
    F: "Future",
    I: "Imperfect",
    P: "Present",
    R: "Perfect",
    X: "Perfect",
    Y: "Pluperfect",
};

const VOICE: Record<string, string> = {
    A: "Active",
    D: "Middle Deponent",
    M: "Middle",
    N: "Middle or Passive Deponent",
    P: "Passive",
    X: "Indefinite voice",
};

const MOOD: Record<string, string> = {
    D: "Imperative",
    I: "Indicative",
    N: "Infinitive",
    O: "Optative",
    P: "Participle",
    S: "Subjunctive",
};

const CASE: Record<string, string> = {
    A: "Accusative",
    D: "Dative",
    G: "Genitive",
    N: "Nominative",
    V: "Vocative",
};

const NUMBER: Record<string, string> = {
    P: "Plural",
    S: "Singular",
};

const GENDER: Record<string, string> = {
    F: "Feminine",
    M: "Masculine",
    N: "Neuter",
};

const PERSON: Record<string, string> = {
    "1": "1st",
    "2": "2nd",
    "3": "3rd",
};

const QUALIFIER: Record<string, string> = {
    T: "Title",
    L: "Indeclinable",
    G: "Proper-name marker",
};

function parseDeclensionTail(tail: string) {
    const result = {
        person: null as string | null,
        grammaticalCase: null as string | null,
        number: null as string | null,
        gender: null as string | null,
        degree: null as string | null,
    };

    if (/^[123][SP]$/.test(tail)) {
        result.person = PERSON[tail[0]!] ?? null;
        result.number = NUMBER[tail[1]!] ?? null;
        return result;
    }

    if (/^[NDGAV][SP][MFN]$/.test(tail)) {
        result.grammaticalCase = CASE[tail[0]!] ?? null;
        result.number = NUMBER[tail[1]!] ?? null;
        result.gender = GENDER[tail[2]!] ?? null;
        return result;
    }

    if (/^[A-Z]-[CS]$/.test(tail)) {
        result.degree = tail.endsWith("C") ? "Comparative" : "Superlative";
    }

    return result;
}

export function parseGreekMorphology(code: string): StrongsMorphology {
    const normalized = code.trim();
    if (!normalized) throw new Error("A Greek morphology code is required.");

    const [functionCode = "", pattern = "", ...rest] = normalized.split("-");
    const partOfSpeech = PART_OF_SPEECH[functionCode] ?? null;

    let tense: string | null = null;
    let voice: string | null = null;
    let mood: string | null = null;
    let form: string | null = null;
    let person: string | null = null;
    let grammaticalCase: string | null = null;
    let number: string | null = null;
    let gender: string | null = null;
    let degree: string | null = null;
    let qualifier: string | null = null;

    if (functionCode === "V" && pattern.length >= 3) {
        tense = TENSE[pattern[0]!] ?? null;
        voice = VOICE[pattern[1]!] ?? null;
        mood = MOOD[pattern[2]!] ?? null;
        form = mood === "Participle" || mood === "Infinitive" ? mood : null;

        const tail = rest[0] ?? "";
        const parsedTail = parseDeclensionTail(tail);
        person = parsedTail.person;
        grammaticalCase = parsedTail.grammaticalCase;
        number = parsedTail.number;
        gender = parsedTail.gender;
        degree = parsedTail.degree;
        qualifier = rest[1] ? QUALIFIER[rest[1]] ?? rest.slice(1).join("-") : null;
    } else {
        const parsedTail = parseDeclensionTail(pattern);
        grammaticalCase = parsedTail.grammaticalCase;
        number = parsedTail.number;
        gender = parsedTail.gender;
        degree = parsedTail.degree;
        qualifier = rest[0] ? QUALIFIER[rest[0]!] ?? rest.join("-") : null;
    }

    const parts = [
        partOfSpeech,
        tense,
        voice,
        mood,
        form,
        person ? person + " person" : null,
        grammaticalCase,
        number,
        gender,
        degree,
        qualifier,
    ].filter((value): value is string => Boolean(value));

    return {
        language: "G",
        code: normalized,
        partOfSpeech,
        tense,
        voice,
        mood,
        form,
        person,
        grammaticalCase,
        number,
        gender,
        degree,
        qualifier,
        summary: parts.join(" · ") || normalized,
    };
}
