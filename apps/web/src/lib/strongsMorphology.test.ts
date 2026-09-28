import { describe, expect, it } from "vitest";

import { parseGreekMorphology } from "./strongsMorphology";

describe("Greek morphology", () => {
    it("decodes a nominal morphology code", () => {
        expect(parseGreekMorphology("N-NSF")).toMatchObject({
            language: "G",
            code: "N-NSF",
            partOfSpeech: "Noun",
            grammaticalCase: "Nominative",
            number: "Singular",
            gender: "Feminine",
        });

        expect(parseGreekMorphology("N-NSF").summary).toContain(
            "Nominative · Singular · Feminine",
        );
    });

    it("decodes a finite present verb", () => {
        expect(parseGreekMorphology("V-PNI-1S")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Present",
            voice: "Middle or Passive Deponent",
            mood: "Indicative",
            person: "1st",
            number: "Singular",
        });
    });

    it("decodes a second-aorist finite verb", () => {
        expect(parseGreekMorphology("V-2AAI-3S")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Second Aorist",
            voice: "Active",
            mood: "Indicative",
            person: "3rd",
            number: "Singular",
        });

        expect(parseGreekMorphology("V-2AAI-3S").summary).toContain(
            "Second Aorist · Active · Indicative · 3rd person · Singular",
        );
    });

    it("decodes a second-perfect finite verb", () => {
        expect(parseGreekMorphology("V-2RAI-3P")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Second Perfect",
            voice: "Active",
            mood: "Indicative",
            person: "3rd",
            number: "Plural",
        });
    });

    it("decodes a pluperfect finite verb", () => {
        expect(parseGreekMorphology("V-LAI-3S")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Pluperfect",
            voice: "Active",
            mood: "Indicative",
            person: "3rd",
            number: "Singular",
        });
    });

    it("decodes a participle using case-number-gender", () => {
        expect(parseGreekMorphology("V-PAP-NSM")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Present",
            voice: "Active",
            mood: "Participle",
            form: "Participle",
            grammaticalCase: "Nominative",
            number: "Singular",
            gender: "Masculine",
        });
    });

    it("decodes a second-aorist passive participle", () => {
        expect(parseGreekMorphology("V-2AAP-NSM")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Second Aorist",
            voice: "Active",
            mood: "Participle",
            grammaticalCase: "Nominative",
            number: "Singular",
            gender: "Masculine",
        });
    });

    it("decodes a verb infinitive without person", () => {
        expect(parseGreekMorphology("V-2AAN")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Second Aorist",
            voice: "Active",
            mood: "Infinitive",
            form: "Infinitive",
            person: null,
            grammaticalCase: null,
            number: null,
            gender: null,
        });
    });

    it("decodes first-person pronouns with case and number", () => {
        expect(parseGreekMorphology("P-1NS")).toMatchObject({
            partOfSpeech: "Personal pronoun",
            person: "1st",
            grammaticalCase: "Nominative",
            number: "Singular",
            gender: null,
        });
    });

    it("decodes ordinary pronouns without an explicit person", () => {
        expect(parseGreekMorphology("P-GSM")).toMatchObject({
            partOfSpeech: "Personal pronoun",
            person: null,
            grammaticalCase: "Genitive",
            number: "Singular",
            gender: "Masculine",
        });
    });

    it("decodes demonstrative and correlative pronouns", () => {
        expect(parseGreekMorphology("D-ASM")).toMatchObject({
            partOfSpeech: "Demonstrative pronoun",
            grammaticalCase: "Accusative",
            number: "Singular",
            gender: "Masculine",
        });

        expect(parseGreekMorphology("Q-NSM")).toMatchObject({
            partOfSpeech: "Correlative / interrogative pronoun",
            grammaticalCase: "Nominative",
            number: "Singular",
            gender: "Masculine",
        });
    });

    it("decodes uninflected morphology categories and variants", () => {
        expect(parseGreekMorphology("CONJ").summary).toBe("Conjunction");
        expect(parseGreekMorphology("PREP").summary).toBe("Preposition");
        expect(parseGreekMorphology("ADV").summary).toBe("Adverb");
        expect(parseGreekMorphology("ADV-C")).toMatchObject({
            partOfSpeech: "Adverb",
            degree: "Comparative",
        });
        expect(parseGreekMorphology("PRT-N")).toMatchObject({
            partOfSpeech: "Particle",
            qualifier: "Negative",
        });
    });

    it("decodes adjective degree and lexical qualifiers", () => {
        expect(parseGreekMorphology("A-NSM-C")).toMatchObject({
            partOfSpeech: "Adjective",
            grammaticalCase: "Nominative",
            number: "Singular",
            gender: "Masculine",
            degree: "Comparative",
        });

        expect(parseGreekMorphology("N-NSM-T").qualifier).toBe("Title");
        expect(parseGreekMorphology("N-PRI").qualifier).toContain("Indeclinable");
    });

    it("rejects an empty morphology code", () => {
        expect(() => parseGreekMorphology("")).toThrow(/morphology code/i);
    });
});
