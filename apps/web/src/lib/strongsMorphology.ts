export interface StrongsMorphology {
    readonly language: "G" | "H" | "A";
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
    readonly state: string | null;
    readonly degree: string | null;
    readonly qualifier: string | null;
    readonly summary: string;
    readonly segments?: readonly StrongsMorphology[];
}

const PART_OF_SPEECH: Record<string, string> = {
    A: "Adjective",
    C: "Conjunction",
    D: "Demonstrative pronoun",
    F: "Reflexive pronoun",
    I: "Interrogative pronoun",
    N: "Noun",
    P: "Personal pronoun",
    Q: "Correlative / interrogative pronoun",
    R: "Relative pronoun",
    S: "Possessive pronoun",
    T: "Article",
    V: "Verb",
    X: "Indefinite pronoun",
};

const UNINFLECTED: Record<string, string> = {
    ADV: "Adverb",
    CONJ: "Conjunction",
    PREP: "Preposition",
    PRT: "Particle",
    INJ: "Interjection",
    COND: "Conditional conjunction",
};

const UNINFLECTED_QUALIFIER: Record<string, string> = {
    I: "Interrogative",
    N: "Negative",
    T: "Title",
    G: "Gentilic",
    L: "Location",
    LG: "Location Gentilic",
    PG: "Person Gentilic",
    TG: "Title Gentilic",
    ARAM: "Transcribed from Aramaic",
    K: "Particle combination",
};

const TENSE: Record<string, string> = {
    A: "Aorist",
    F: "Future",
    I: "Imperfect",
    L: "Pluperfect",
    P: "Present",
    R: "Perfect",
    X: "Perfect",
    "2A": "Second Aorist",
    "2R": "Second Perfect",
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
    P: "Proper name/person",
    G: "Gentilic",
    L: "Location",
    LG: "Location Gentilic",
    PG: "Person Gentilic",
    TG: "Title Gentilic",
    K: "Special form",
    NUI: "Numeral / indeclinable",
    I: "Indeclinable",
    ATT: "Attic form",
    AP: "Attic/poetic form",
};

interface ParsedGrammarTail {
    readonly person: string | null;
    readonly grammaticalCase: string | null;
    readonly number: string | null;
    readonly gender: string | null;
}

function parseGrammarTail(tail: string): ParsedGrammarTail {
    const personCaseNumberGender = tail.match(/^([123])([NDGAV])([SP])([MFN])?$/);
    if (personCaseNumberGender) {
        return {
            person: PERSON[personCaseNumberGender[1]!] ?? null,
            grammaticalCase: CASE[personCaseNumberGender[2]!] ?? null,
            number: NUMBER[personCaseNumberGender[3]!] ?? null,
            gender: personCaseNumberGender[4]
                ? GENDER[personCaseNumberGender[4]] ?? null
                : null,
        };
    }

    const caseNumberGender = tail.match(/^([NDGAV])([SP])([MFN])$/);
    if (caseNumberGender) {
        return {
            person: null,
            grammaticalCase: CASE[caseNumberGender[1]!] ?? null,
            number: NUMBER[caseNumberGender[2]!] ?? null,
            gender: GENDER[caseNumberGender[3]!] ?? null,
        };
    }

    const caseNumber = tail.match(/^([NDGAV])([SP])$/);
    if (caseNumber) {
        return {
            person: null,
            grammaticalCase: CASE[caseNumber[1]!] ?? null,
            number: NUMBER[caseNumber[2]!] ?? null,
            gender: null,
        };
    }

    return {
        person: null,
        grammaticalCase: null,
        number: null,
        gender: null,
    };
}

function qualifierLabel(value: string): string {
    return QUALIFIER[value] ?? value;
}

export function parseGreekMorphology(code: string): StrongsMorphology {
    const normalized = code.trim();
    if (!normalized) throw new Error("A Greek morphology code is required.");

    const exactUninflected = UNINFLECTED[normalized];
    if (exactUninflected) {
        return {
            language: "G",
            code: normalized,
            partOfSpeech: exactUninflected,
            tense: null,
            voice: null,
            mood: null,
            form: null,
            person: null,
            grammaticalCase: null,
            number: null,
            gender: null,
            state: null,
            degree: null,
            qualifier: null,
            summary: exactUninflected,
        };
    }

    const segments = normalized.split("-");
    const functionCode = segments[0] ?? "";
    const pattern = segments[1] ?? "";
    const uninflectedPartOfSpeech = UNINFLECTED[functionCode];
    const partOfSpeech = uninflectedPartOfSpeech ?? PART_OF_SPEECH[functionCode] ?? null;

    let tense: string | null = null;
    let voice: string | null = null;
    let mood: string | null = null;
    let form: string | null = null;
    let person: string | null = null;
    let grammaticalCase: string | null = null;
    let number: string | null = null;
    let gender: string | null = null;
    const state: string | null = null;
    let degree: string | null = null;
    let qualifier: string | null = null;

    if (uninflectedPartOfSpeech) {
        const variantSegments = segments.slice(1).filter(Boolean);
        for (const variant of variantSegments) {
            if (variant === "C" && (functionCode === "ADV" || functionCode === "PRT")) {
                degree = "Comparative";
            } else if (variant === "S" && functionCode === "ADV") {
                degree = "Superlative";
            } else if (variant === "C" && functionCode === "CONJ") {
                qualifier = [qualifier, "Comparative"].filter(Boolean).join(" · ");
            } else {
                const label = UNINFLECTED_QUALIFIER[variant] ?? qualifierLabel(variant);
                qualifier = [qualifier, label].filter(Boolean).join(" · ");
            }
        }
    } else if (functionCode === "V") {
        const verbPattern = pattern.match(/^(2)?([A-Z])([A-Z])([A-Z])$/);

        if (verbPattern) {
            const secondForm = verbPattern[1] === "2";
            const tenseKey = secondForm
                ? "2" + verbPattern[2]
                : verbPattern[2]!;

            tense = TENSE[tenseKey] ?? null;
            voice = VOICE[verbPattern[3]!] ?? null;
            mood = MOOD[verbPattern[4]!] ?? null;
            form = mood === "Participle" || mood === "Infinitive" ? mood : null;

            const tail = segments[2] ?? "";
            const parsedTail = parseGrammarTail(tail);
            person = parsedTail.person;
            grammaticalCase = parsedTail.grammaticalCase;
            number = parsedTail.number;
            gender = parsedTail.gender;

            const extraSegments = segments.slice(3).filter(Boolean);
            if (extraSegments.length > 0) {
                qualifier = extraSegments.map(qualifierLabel).join(" · ");
            }
        } else if (segments.length > 2) {
            const extraSegments = segments.slice(2).filter(Boolean);
            qualifier = extraSegments.length > 0
                ? extraSegments.map(qualifierLabel).join(" · ")
                : null;
        }
    } else {
        const parsedTail = parseGrammarTail(pattern);
        person = parsedTail.person;
        grammaticalCase = parsedTail.grammaticalCase;
        number = parsedTail.number;
        gender = parsedTail.gender;

        const extraSegments = segments.slice(2).filter(Boolean);
        for (const extra of extraSegments) {
            if (extra === "C") {
                degree = "Comparative";
            } else if (extra === "S") {
                degree = "Superlative";
            } else {
                qualifier = [qualifier, qualifierLabel(extra)].filter(Boolean).join(" · ");
            }
        }

        if (functionCode === "N" && pattern === "PRI") {
            qualifier = [qualifier, "Proper name", "Indeclinable"]
                .filter(Boolean)
                .join(" · ");
        }
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
        state,
        degree,
        qualifier,
        summary: parts.join(" · ") || normalized,
    };
}
