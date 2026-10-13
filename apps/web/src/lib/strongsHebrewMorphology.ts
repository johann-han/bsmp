import type { StrongsMorphology } from "./strongsMorphology";

const PART_OF_SPEECH: Record<string, string> = {
    A: "Adjective",
    C: "Conjunction",
    c: "Conjunction",
    D: "Adverb",
    N: "Noun",
    P: "Pronoun",
    R: "Preposition",
    S: "Suffix",
    T: "Particle",
    V: "Verb",
};

const CONJUNCTION_TYPE: Record<string, string> = {
    c: "Conjunctive",
    v: "Vav consecutive",
};

const ADJECTIVE_TYPE: Record<string, string> = {
    a: "Adjective",
    c: "Cardinal number",
    g: "Gentilic",
    o: "Ordinal number",
    x: "Unspecified",
};

const NOUN_TYPE: Record<string, string> = {
    c: "Common",
    g: "Gentilic",
    p: "Proper name",
    t: "Title",
    x: "Unspecified",
};

const PRONOUN_TYPE: Record<string, string> = {
    d: "Demonstrative",
    f: "Indefinite",
    i: "Interrogative",
    p: "Personal",
    r: "Relative",
    x: "Unspecified",
};

const PREPOSITION_TYPE: Record<string, string> = {
    d: "Definite article",
};

const SUFFIX_TYPE: Record<string, string> = {
    d: "Directional he",
    h: "Paragogic he",
    n: "Paragogic nun",
    p: "Pronominal",
    x: "Unspecified",
};

const PARTICLE_TYPE: Record<string, string> = {
    a: "Affirmation",
    d: "Definite article",
    e: "Exhortation",
    i: "Interrogative",
    j: "Interjection",
    m: "Demonstrative",
    n: "Negative",
    o: "Direct object marker",
    p: "Definite article with inseparable preposition",
    r: "Relative",
};

const HEBREW_VERB_STEM: Record<string, string> = {
    q: "Qal",
    N: "Niphal",
    p: "Piel",
    P: "Pual",
    h: "Hiphil",
    H: "Hophal",
    t: "Hithpael",
    o: "Polel",
    O: "Polal",
    r: "Hithpolel",
    m: "Poel",
    M: "Poal",
    k: "Palel",
    K: "Pulal",
    Q: "Qal passive",
    l: "Pilpel",
    L: "Polpal",
    f: "Hithpalpel",
    D: "Nithpael",
    j: "Pealal",
    i: "Pilel",
    u: "Hothpaal",
    c: "Tiphil",
    v: "Hishtaphel",
    w: "Nithpalel",
    y: "Nithpoel",
    z: "Hithpoel",
};

const ARAMAIC_VERB_STEM: Record<string, string> = {
    q: "Peal",
    Q: "Peil",
    u: "Hithpeel",
    N: "Niphal",
    p: "Pael",
    P: "Ithpaal",
    M: "Hithpaal",
    a: "Aphel",
    h: "Haphel",
    s: "Saphel",
    e: "Shaphel",
    H: "Hophal",
    i: "Ithpeel",
    t: "Hishtaphel",
    v: "Ishtaphel",
    w: "Hithaphel",
    o: "Polel",
    z: "Ithpoel",
    r: "Hithpolel",
    f: "Hithpalpel",
    b: "Hephal",
    c: "Tiphel",
    m: "Poel",
    l: "Palpel",
    L: "Ithpalpel",
    O: "Ithpolel",
    G: "Ittaphal",
};

const VERB_ASPECT: Record<string, string> = {
    a: "Infinitive absolute",
    c: "Infinitive construct",
    h: "Cohortative",
    i: "Imperfect",
    j: "Jussive",
    p: "Perfect",
    q: "Sequential perfect",
    r: "Participle active",
    s: "Participle passive",
    v: "Imperative",
    w: "Sequential imperfect",
};

const GENDER: Record<string, string> = {
    b: "Both",
    c: "Common",
    f: "Feminine",
    m: "Masculine",
    x: "Unspecified",
};

const NUMBER: Record<string, string> = {
    d: "Dual",
    p: "Plural",
    s: "Singular",
    x: "Unspecified",
};

const STATE: Record<string, string> = {
    a: "Absolute",
    c: "Construct",
    d: "Determined",
};

const PERSON: Record<string, string> = {
    "1": "1st",
    "2": "2nd",
    "3": "3rd",
};

interface FeatureTail {
    readonly person: string | null;
    readonly gender: string | null;
    readonly number: string | null;
    readonly state: string | null;
}

function parseGenderNumberState(
    code: string,
    start: number,
    includeState: boolean,
): FeatureTail {
    const gender = GENDER[code[start] ?? ""] ?? null;
    const number = NUMBER[code[start + 1] ?? ""] ?? null;
    const state = includeState ? STATE[code[start + 2] ?? ""] ?? null : null;

    return {
        person: null,
        gender,
        number,
        state,
    };
}

function parsePersonGenderNumber(
    code: string,
    start: number,
): FeatureTail {
    return {
        person: PERSON[code[start] ?? ""] ?? null,
        gender: GENDER[code[start + 1] ?? ""] ?? null,
        number: NUMBER[code[start + 2] ?? ""] ?? null,
        state: null,
    };
}

function addQualifier(values: readonly string[], extra: string | null): string | null {
    const next = extra?.trim();
    const filtered = [...values, next].filter(
        (value): value is string => Boolean(value),
    );
    return filtered.length > 0 ? filtered.join(" · ") : null;
}

function parseParticipleTail(code: string, start: number): FeatureTail {
    const tail = code.slice(start);
    const offset = tail.startsWith("x") ? 1 : 0;

    return {
        person: null,
        gender: GENDER[tail[offset] ?? ""] ?? null,
        number: NUMBER[tail[offset + 1] ?? ""] ?? null,
        state: STATE[tail[offset + 2] ?? ""] ?? null,
    };
}

function summaryParts(values: readonly (string | null)[]): string {
    return values.filter((value): value is string => Boolean(value)).join(" · ");
}

function parseSegment(segment: string, language: "H" | "A"): StrongsMorphology {
    const code = segment.trim();
    const posCode = code[0] ?? "";
    const partOfSpeech = PART_OF_SPEECH[posCode];

    if (!partOfSpeech) {
        return {
            language,
            code: language + code,
            partOfSpeech: null,
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
            qualifier: "Unsupported morphology code",
            summary: code,
        };
    }

    const tense: string | null = null;
    const voice: string | null = null;
    let mood: string | null = null;
    let form: string | null = null;
    let person: string | null = null;
    const grammaticalCase: string | null = null;
    let number: string | null = null;
    let gender: string | null = null;
    let state: string | null = null;
    const degree: string | null = null;
    let qualifier: string | null = null;

    switch (posCode) {
        case "C":
        case "c": {
            qualifier = CONJUNCTION_TYPE[code[1] ?? ""] ?? null;
            break;
        }
        case "A": {
            const type = ADJECTIVE_TYPE[code[1] ?? ""] ?? null;
            const tail = parseGenderNumberState(code, 2, true);
            gender = tail.gender;
            number = tail.number;
            state = tail.state;
            qualifier = addQualifier(type ? [type] : [], tail.state);
            break;
        }
        case "N": {
            const type = NOUN_TYPE[code[1] ?? ""] ?? null;
            if (type === "Proper name" && code[2] === "t") {
                qualifier = "Proper name · Title";
            } else if (code.length > 2) {
                const tail = parseGenderNumberState(code, 2, true);
                gender = tail.gender;
                number = tail.number;
                state = tail.state;
                qualifier = addQualifier(type ? [type] : [], tail.state);
            } else {
                qualifier = type;
            }
            break;
        }
        case "P": {
            const type = PRONOUN_TYPE[code[1] ?? ""] ?? null;
            const tail = parsePersonGenderNumber(code, 2);
            person = tail.person;
            gender = tail.gender;
            number = tail.number;
            qualifier = type;
            break;
        }
        case "R": {
            qualifier = PREPOSITION_TYPE[code[1] ?? ""] ?? null;
            break;
        }
        case "S": {
            const type = SUFFIX_TYPE[code[1] ?? ""] ?? null;
            const tail = parsePersonGenderNumber(code, 2);
            person = tail.person;
            gender = tail.gender;
            number = tail.number;
            qualifier = type;
            break;
        }
        case "T": {
            qualifier = PARTICLE_TYPE[code[1] ?? ""] ?? null;
            break;
        }
        case "V": {
            const stem = (language === "H" ? HEBREW_VERB_STEM : ARAMAIC_VERB_STEM)[
                code[1] ?? ""
            ] ?? null;
            const aspect = VERB_ASPECT[code[2] ?? ""] ?? null;
            form = aspect;
            qualifier = stem;

            if (code[2] === "h") mood = "Cohortative";
            if (code[2] === "j") mood = "Jussive";
            if (code[2] === "v") mood = "Imperative";

            if (["r", "s"].includes(code[2] ?? "")) {
                const tail = parseParticipleTail(code, 3);
                gender = tail.gender;
                number = tail.number;
                state = tail.state;
                qualifier = addQualifier(stem ? [stem] : [], tail.state);
            } else if (["a", "c"].includes(code[2] ?? "")) {
                person = null;
                gender = null;
                number = null;
            } else {
                // Open Scriptures contains a legacy finite-verb form with an
                // extra "j" marker before the person/gender/number tail.
                const featureStart =
                    code[3] === "j" && ["1", "2", "3"].includes(code[4] ?? "")
                        ? 4
                        : 3;
                const tail = parsePersonGenderNumber(code, featureStart);
                person = tail.person;
                gender = tail.gender;
                number = tail.number;
            }
            break;
        }
        default:
            break;
    }

    const details = summaryParts([
        partOfSpeech,
        qualifier,
        form,
        mood,
        person ? person + " person" : null,
        grammaticalCase,
        number,
        gender,
        degree,
        voice,
    ]);

    return {
        language,
        code: language + code,
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
        summary: details || code,
    };
}

export function parseHebrewMorphology(code: string): StrongsMorphology {
    const normalized = code.trim();
    if (!normalized) {
        throw new Error("A Hebrew morphology code is required.");
    }

    const language = normalized[0] as "H" | "A";
    if (language !== "H" && language !== "A") {
        throw new Error("A Hebrew morphology code must begin with H or A.");
    }

    const segments = normalized
        .slice(1)
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean);

    if (segments.length === 0) {
        throw new Error("A Hebrew morphology code must contain a morphology segment.");
    }

    const parsed = segments.map((segment) => parseSegment(segment, language));
    const primary = parsed[0]!;

    const segmentSummary = parsed.map((item) => item.summary).join(" · ");

    return {
        ...primary,
        language,
        code: normalized,
        summary: language === "A"
            ? "Aramaic · " + segmentSummary
            : segmentSummary,
        segments: parsed,
    };
}
