import { describe, expect, it } from "vitest";

import { parseHebrewMorphology } from "./strongsHebrewMorphology";

describe("Hebrew morphology", () => {
    it("decodes a proper-name noun", () => {
        expect(parseHebrewMorphology("HNpmsa")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Proper · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a common feminine singular absolute noun", () => {
        expect(parseHebrewMorphology("HNcfsa")).toMatchObject({
            language: "H",
            code: "HNcfsa",
            partOfSpeech: "Noun",
            number: "Singular",
            gender: "Feminine",
            state: "Absolute",
            qualifier: "Common · Absolute",
        });

        expect(parseHebrewMorphology("HNcfsa").summary).toContain(
            "Noun · Common · Absolute · Feminine · Singular",
        );
    });

    it("decodes a construct noun state", () => {
        expect(parseHebrewMorphology("HNcfsc")).toMatchObject({
            partOfSpeech: "Noun",
            number: "Singular",
            gender: "Feminine",
            state: "Construct",
            qualifier: "Common · Construct",
        });
    });

    it("decodes a participle with the Open Scriptures x placeholder", () => {
        expect(parseHebrewMorphology("HVprxfs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Piel",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: null,
        });

        expect(parseHebrewMorphology("HVprxfs").summary).toContain(
            "Verb · Piel · Participle active · Feminine · Singular",
        );
    });

    it("decodes Open Scriptures masculine singular participles", () => {
        expect(parseHebrewMorphology("HVqrxms")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Qal",
            person: null,
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVhrxms")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Hiphil",
            person: null,
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes a noun with an unspecified gender placeholder", () => {
        expect(parseHebrewMorphology("HNcbpa")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Both",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes a Qal perfect verb", () => {
        expect(parseHebrewMorphology("HVqp3ms")).toMatchObject({
            partOfSpeech: "Verb",
            tense: null,
            form: "Perfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            qualifier: "Qal",
        });

        expect(parseHebrewMorphology("HVqp3ms").summary).toContain(
            "Verb · Qal · Perfect · 3rd person · Masculine · Singular",
        );
        expect(parseHebrewMorphology("HVqp3ms").summary).not.toContain("Past / present");
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

    it("decodes a pronoun with an unspecified gender placeholder", () => {
        expect(parseHebrewMorphology("HPpxpa")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Personal",
            person: null,
            gender: "Both",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes a demonstrative pronoun", () => {
        expect(parseHebrewMorphology("HPpd")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Demonstrative",
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

    it("decodes an adjective with an unspecified gender placeholder", () => {
        expect(parseHebrewMorphology("HAxpa")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Adjective · Absolute",
            gender: "Both",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes a composite Hebrew word code", () => {
        const parsed = parseHebrewMorphology("HC/Vqw3ms");

        expect(parsed).toMatchObject({
            language: "H",
            code: "HC/Vqw3ms",
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain("Verb · Qal · Sequential imperfect");
        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]?.summary).toBe("Conjunction · Consecutive");
        expect(parsed.segments?.[1]?.summary).toContain(
            "Verb · Qal · Sequential imperfect · 3rd person · Masculine · Singular",
        );
    });

    it("decodes Open Scriptures composite article/noun patterns", () => {
        const parsed = parseHebrewMorphology("HTd/Ncmpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain("Noun · Common · Absolute · Plural · Masculine");
    });

    it("decodes an Open Scriptures conjunction plus direct-object-marker composite", () => {
        const parsed = parseHebrewMorphology("HCc/To");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Consecutive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTo",
            partOfSpeech: "Particle",
            qualifier: "Direct object marker",
        });
    });

    it("decodes an Aramaic verb using the same Open Scriptures code structure", () => {
        expect(parseHebrewMorphology("AVqp3ms")).toMatchObject({
            language: "A",
            partOfSpeech: "Verb",
            form: "Perfect",
            qualifier: "Peal",
        });
        expect(parseHebrewMorphology("AVqp3ms").summary).toContain(
            "Aramaic · Verb · Peal · Perfect",
        );
    });

    it("preserves Aramaic on composite morphology codes", () => {
        const parsed = parseHebrewMorphology("AC/AVqp3ms");

        expect(parsed.language).toBe("A");
        expect(parsed.segments?.[0]?.language).toBe("A");
        expect(parsed.segments?.[1]?.language).toBe("A");
        expect(parsed.summary).toContain("Aramaic");
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
