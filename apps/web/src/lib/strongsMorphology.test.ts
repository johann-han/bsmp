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

    it("decodes a finite verb morphology code", () => {
        expect(parseGreekMorphology("V-PNI-1S")).toMatchObject({
            partOfSpeech: "Verb",
            tense: "Present",
            voice: "Middle or Passive Deponent",
            mood: "Indicative",
            person: "1st",
            number: "Singular",
        });
    });

    it("decodes an adjectival case-number-gender tail", () => {
        expect(parseGreekMorphology("A-DSM")).toMatchObject({
            partOfSpeech: "Adjective",
            grammaticalCase: "Dative",
            number: "Singular",
            gender: "Masculine",
        });
    });

    it("rejects an empty morphology code", () => {
        expect(() => parseGreekMorphology("")).toThrow(/morphology code/i);
    });
});
