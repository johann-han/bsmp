import { describe, expect, it } from "vitest";

import { parseHebrewMorphology } from "./strongsHebrewMorphology";

describe("Hebrew morphology", () => {
    it("decodes a common feminine singular absolute noun", () => {
        expect(parseHebrewMorphology("HNcfsa")).toMatchObject({
            language: "H",
            code: "HNcfsa",
            partOfSpeech: "Noun",
            number: "Singular",
            gender: "Feminine",
            qualifier: "Common · Absolute",
        });

        expect(parseHebrewMorphology("HNcfsa").summary).toContain(
            "Noun · Common · Absolute · Feminine · Singular",
        );
    });

    it("decodes a Qal perfect verb", () => {
        expect(parseHebrewMorphology("HVqp3ms")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Perfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            qualifier: "Qal",
        });

        expect(parseHebrewMorphology("HVqp3ms").summary).toContain(
            "Verb · Qal · Perfect · 3rd person · Masculine · Singular",
        );
    });

    it("decodes the consecutive conjunction form", () => {
        expect(parseHebrewMorphology("Hc")).toMatchObject({
            language: "H",
            partOfSpeech: "Conjunction",
            qualifier: "Consecutive",
        });
    });

    it("decodes a definite article", () => {
        expect(parseHebrewMorphology("HTd")).toMatchObject({
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
    });

    it("decodes a personal pronoun", () => {
        expect(parseHebrewMorphology("HPp3ms")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Personal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
    });

    it("decodes a composite Hebrew word code", () => {
        expect(parseHebrewMorphology("HC/Vqw3ms")).toMatchObject({
            language: "H",
            code: "HC/Vqw3ms",
        });
        expect(parseHebrewMorphology("HC/Vqw3ms").summary).toContain(
            "Conjunction",
        );
        expect(parseHebrewMorphology("HC/Vqw3ms").summary).toContain(
            "Verb · Qal · Sequential imperfect",
        );
    });

    it("decodes an Aramaic verb using the same Open Scriptures code structure", () => {
        expect(parseHebrewMorphology("AVqp3ms")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            form: "Perfect",
            qualifier: "Peal",
        });
        expect(parseHebrewMorphology("AVqp3ms").summary).toContain(
            "Aramaic · Verb · Peal · Perfect",
        );
    });

    it("rejects an empty code and an invalid language", () => {
        expect(() => parseHebrewMorphology("")).toThrow(/morphology code/i);
        expect(() => parseHebrewMorphology("GNcfsa")).toThrow(/H or A/i);
    });

    it("keeps an unknown form conservative", () => {
        expect(parseHebrewMorphology("HNpt").summary).toContain(
            "Noun · Proper name · Title",
        );
    });
});
